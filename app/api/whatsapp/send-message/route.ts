import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/src/lib/server";

const GRAPH_API_VERSION = "v26.0";
const TEMPLATE_NAME = "missed_call_confirmation";
const TEMPLATE_LANGUAGE = "ar";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function normalizeMoroccanPhone(phone: string) {
  let value = phone.replace(/\D/g, "");

  if (value.startsWith("0")) {
    value = "212" + value.slice(1);
  }

  if (value.startsWith("212")) {
    return value;
  }

  return value;
}

function normalizeValue(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export async function POST(request: Request) {
  console.log("🔥 WHATSAPP TEMPLATE ROUTE");

  try {
    const supabase = await getServerSupabase();

    // -----------------------------------------
    // 1. Authenticated user
    // -----------------------------------------

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Utilisateur non authentifié.",
        },
        { status: 401 }
      );
    }

    // -----------------------------------------
    // 2. Body
    // -----------------------------------------

    const body = await request.json();

    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID de commande manquant.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 3. Store
    // -----------------------------------------

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (storeError || !store) {
      console.error("Store error:", storeError);

      return NextResponse.json(
        {
          success: false,
          message: "Store introuvable.",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // 4. Order
    // -----------------------------------------

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        store_id,
        product,
        name,
        phone,
        color,
        size
      `)
      .eq("id", order_id)
      .eq("store_id", store.id)
      .single();

    if (orderError || !order) {
      console.error("Order error:", orderError);

      return NextResponse.json(
        {
          success: false,
          message: "Commande introuvable.",
        },
        { status: 404 }
      );
    }

    if (!order.phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Numéro de téléphone manquant dans la commande.",
        },
        { status: 400 }
      );
    }

    if (!order.name) {
      return NextResponse.json(
        {
          success: false,
          message: "Nom du client manquant dans la commande.",
        },
        { status: 400 }
      );
    }

    if (!order.product) {
      return NextResponse.json(
        {
          success: false,
          message: "Produit manquant dans la commande.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 5. Stock product
    // -----------------------------------------

    const { data: stockProduct, error: stockProductError } =
      await supabase
        .from("stock_products")
        .select("id, name")
        .eq("store_id", store.id)
        .eq("name", order.product)
        .maybeSingle();

    if (stockProductError) {
      console.error(
        "Stock product error:",
        stockProductError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Impossible de récupérer le produit du stock.",
        },
        { status: 500 }
      );
    }

    if (!stockProduct) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Produit introuvable dans le stock pour cette commande.",
          product: order.product,
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // 6. Stock variant
    // -----------------------------------------

    const { data: variants, error: variantsError } = await supabase
      .from("stock_variants")
      .select(`
        id,
        product_id,
        color,
        size,
        image_url,
        quantity
      `)
      .eq("product_id", stockProduct.id);

    if (variantsError) {
      console.error(
        "Stock variants error:",
        variantsError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Impossible de récupérer les variantes du stock.",
        },
        { status: 500 }
      );
    }

    if (!variants || variants.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Aucune variante trouvée pour ce produit dans le stock.",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // 7. Find exact variant
    // -----------------------------------------

    const normalizedOrderColor = normalizeValue(order.color);
    const normalizedOrderSize = normalizeValue(order.size);

    const variant = variants.find((item) => {
      const variantColor = normalizeValue(item.color);
      const variantSize = normalizeValue(item.size);

      return (
        variantColor === normalizedOrderColor &&
        variantSize === normalizedOrderSize
      );
    });

    if (!variant) {
      console.error("Variant not found", {
        order_id: order.id,
        product: order.product,
        color: order.color,
        size: order.size,
        variants: variants.map((item) => ({
          id: item.id,
          color: item.color,
          size: item.size,
        })),
      });

      return NextResponse.json(
        {
          success: false,
          message:
            "La variante exacte du produit n'a pas été trouvée dans le stock.",
          product: order.product,
          color: order.color,
          size: order.size,
        },
        { status: 404 }
      );
    }

    if (!variant.image_url) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Aucune image n'est enregistrée pour cette variante du stock.",
          variant_id: variant.id,
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 8. Normalize phone
    // -----------------------------------------

    const recipientPhone = normalizeMoroccanPhone(
      String(order.phone)
    );

    if (!recipientPhone) {
      return NextResponse.json(
        {
          success: false,
          message: "Numéro de téléphone invalide.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 9. WhatsApp conversation
    //
    // IMPORTANT: the first WhatsApp template must be stored in the
    // same conversation history as replies, otherwise a customer
    // response appears without the message/context we sent first.
    // -----------------------------------------

    const admin = getSupabaseAdmin();
    const normalizedCustomerPhone = recipientPhone;

    const {
      data: existingOrderConversation,
      error: existingOrderConversationError,
    } = await admin
      .from("whatsapp_conversations")
      .select("id, store_id, order_id, phone, customer_name")
      .eq("store_id", store.id)
      .eq("order_id", order.id)
      .maybeSingle();

    if (existingOrderConversationError) {
      console.error(
        "WhatsApp order conversation lookup error:",
        existingOrderConversationError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Impossible de vérifier l'historique WhatsApp de la commande.",
        },
        { status: 500 }
      );
    }

    let conversation = existingOrderConversation;

    if (!conversation) {
      const {
        data: phoneConversation,
        error: phoneConversationError,
      } = await admin
        .from("whatsapp_conversations")
        .select("id, store_id, order_id, phone, customer_name")
        .eq("store_id", store.id)
        .eq("phone", normalizedCustomerPhone)
        .maybeSingle();

      if (phoneConversationError) {
        console.error(
          "WhatsApp phone conversation lookup error:",
          phoneConversationError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Impossible de récupérer la conversation WhatsApp du client.",
          },
          { status: 500 }
        );
      }

      conversation = phoneConversation;
    }

    if (!conversation) {
      const now = new Date().toISOString();

      const {
        data: createdConversation,
        error: createConversationError,
      } = await admin
        .from("whatsapp_conversations")
        .insert({
          store_id: store.id,
          order_id: order.id,
          phone: normalizedCustomerPhone,
          customer_name: order.name,
          last_message_at: now,
          unread_count: 0,
          created_at: now,
          updated_at: now,
        })
        .select(
          "id, store_id, order_id, phone, customer_name"
        )
        .single();

      if (createConversationError || !createdConversation) {
        console.error(
          "WhatsApp conversation creation error:",
          createConversationError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Impossible de créer la conversation WhatsApp.",
          },
          { status: 500 }
        );
      }

      conversation = createdConversation;
    }

    // The Stage 1 message is about this specific order, so keep the
    // conversation linked to the current order for immediate context.
    const { error: linkOrderError } = await admin
      .from("whatsapp_conversations")
      .update({
        order_id: order.id,
        customer_name:
          conversation.customer_name || order.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);

    if (linkOrderError) {
      console.error(
        "WhatsApp conversation order link error:",
        linkOrderError
      );
    }

    // -----------------------------------------
    // 10. WhatsApp connection
    // -----------------------------------------

const {
  data: connection,
  error: connectionError,
} = await supabase
  .from("whatsapp_connections")
  .select(
    "id, store_id, phone_number, phone_number_id, waba_id, access_token, is_active"
  )
  .eq("store_id", store.id)
  .eq("is_active", true)
  .maybeSingle();

    if (connectionError) {
      console.error(
        "Erreur récupération connexion WhatsApp:",
        connectionError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Impossible de récupérer la configuration WhatsApp.",
        },
        { status: 500 }
      );
    }

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          message: "Aucune connexion WhatsApp configurée.",
        },
        { status: 404 }
      );
    }

    if (
      !connection.phone_number_id ||
      !connection.access_token
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Phone Number ID ou Access Token manquant.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 11. Logs
    // -----------------------------------------

    console.log("======================================");
    console.log("===== WHATSAPP TEMPLATE SEND =====");
    console.log("Order ID:", order.id);
    console.log("Client:", order.name);
    console.log("Phone original:", order.phone);
    console.log("Phone normalized:", recipientPhone);
    console.log("Product:", order.product);
    console.log("Color:", order.color);
    console.log("Size:", order.size);
    console.log("Variant ID:", variant.id);
    console.log("Image URL:", variant.image_url);
    console.log(
      "Phone Number ID:",
      connection.phone_number_id
    );
    console.log("Template:", TEMPLATE_NAME);
    console.log("Language:", TEMPLATE_LANGUAGE);
    console.log("======================================");

    // -----------------------------------------
    // 12. Meta WhatsApp API
    // -----------------------------------------

    const url =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${connection.phone_number_id}/messages`;

    const payload = {
      messaging_product: "whatsapp",

      to: recipientPhone,

      type: "template",

      template: {
        name: TEMPLATE_NAME,

        language: {
          code: TEMPLATE_LANGUAGE,
        },

        components: [
          {
            type: "header",

            parameters: [
              {
                type: "image",

                image: {
                  link: variant.image_url,
                },
              },
            ],
          },

         {
  type: "body",

  parameters: [
    {
      type: "text",
      parameter_name: "customer_name",
      text: String(order.name).trim(),
    },
  ],
},
        ],
      },
    };

    const metaResponse = await fetch(url, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),

      cache: "no-store",
    });

    // -----------------------------------------
    // 13. Read Meta response
    // -----------------------------------------

    const responseText = await metaResponse.text();

    let metaData: unknown;

    try {
      metaData = JSON.parse(responseText);
    } catch {
      metaData = {
        raw_response: responseText,
      };
    }

    console.log("===== META RESPONSE =====");
    console.log(
      JSON.stringify(metaData, null, 2)
    );
    console.log(
      "HTTP STATUS:",
      metaResponse.status
    );
    console.log("=========================");

    // -----------------------------------------
    // 14. Meta error
    // -----------------------------------------

    if (!metaResponse.ok) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Meta a refusé l'envoi du template WhatsApp.",

          meta_status: metaResponse.status,

          meta_response: metaData,

          order_id: order.id,

          recipient: recipientPhone,

          template: TEMPLATE_NAME,
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------------------
    // 15. Save outgoing template message + success
    // -----------------------------------------

    const whatsappMessageId =
      metaData &&
      typeof metaData === "object" &&
      "messages" in metaData &&
      Array.isArray((metaData as any).messages)
        ? (metaData as any).messages?.[0]?.id || null
        : null;

    const now = new Date().toISOString();

    const templateBody = `مرحباً ${String(order.name).trim()} 👋\n\nأنا أيوب من فريق Casstor.\n\nحاولنا الاتصال بكم لتأكيد طلبكم، لكن لم نتمكن من التواصل معكم هاتفياً.\n\n📦 المرجو الرد على هذه الرسالة لتأكيد طلبكم، وسنعمل على شحنه إليكم في أقرب وقت.\n\nشكراً لثقتكم بنا 🙏`;

    const {
      data: savedMessage,
      error: saveMessageError,
    } = await admin
      .from("whatsapp_messages")
      .insert({
        conversation_id: conversation.id,
        store_id: store.id,
        whatsapp_message_id: whatsappMessageId,
        direction: "outgoing",
        message_type: "template",
        body: templateBody,
        media_id: null,
        media_mime_type: "image/jpeg",
        // Pour un template avec image, on conserve l'URL exacte de la
        // variante dans `caption` afin que l'Inbox puisse reconstruire
        // visuellement le header image du template sans ajouter de colonne DB.
        caption: variant.image_url,
        status: "sent",
        created_at: now,
      })
      .select(
        "id, conversation_id, whatsapp_message_id, direction, message_type, body, media_id, media_mime_type, caption, status, created_at"
      )
      .single();

    if (saveMessageError) {
      console.error(
        "Outgoing WhatsApp template save error:",
        saveMessageError
      );

      return NextResponse.json({
        success: true,
        warning:
          "Message WhatsApp envoyé, mais impossible de l'enregistrer dans l'historique.",
        order_id: order.id,
        conversation_id: conversation.id,
        recipient: recipientPhone,
        whatsapp_message_id: whatsappMessageId,
        meta_response: metaData,
      });
    }

    const { error: conversationUpdateError } = await admin
      .from("whatsapp_conversations")
      .update({
        order_id: conversation.order_id || order.id,
        customer_name: conversation.customer_name || order.name,
        last_message_at: now,
        updated_at: now,
      })
      .eq("id", conversation.id);

    if (conversationUpdateError) {
      console.error(
        "WhatsApp conversation update after send error:",
        conversationUpdateError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Template WhatsApp envoyé et enregistré dans l'historique.",
      order_id: order.id,
      conversation_id: conversation.id,
      recipient: recipientPhone,
      customer_name: order.name,
      whatsapp_message_id: whatsappMessageId,
      saved_message: savedMessage,
      meta_response: metaData,

      product: order.product,

      color: order.color,

      size: order.size,

      variant_id: variant.id,

      image_url: variant.image_url,

      template: TEMPLATE_NAME,
    });
  } catch (error) {
    console.error(
      "Erreur envoi WhatsApp template:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Une erreur inattendue est survenue.",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}