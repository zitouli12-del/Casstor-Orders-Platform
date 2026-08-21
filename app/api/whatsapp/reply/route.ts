import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/src/lib/server";

const GRAPH_API_VERSION = "v26.0";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!SUPABASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing."
    );
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing."
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

  return value;
}

export async function POST(request: Request) {
  try {
    // =====================================================
    // 1. AUTHENTICATED USER
    // =====================================================

    const supabase = await getServerSupabase();

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

    // =====================================================
    // 2. BODY
    // =====================================================

    const body = await request.json();

    const {
      conversation_id,
      message,
    } = body;

    if (!conversation_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Conversation manquante.",
        },
        { status: 400 }
      );
    }

    if (
      !message ||
      !String(message).trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Message vide.",
        },
        { status: 400 }
      );
    }

    const text = String(message).trim();

    // =====================================================
    // 3. STORE
    // =====================================================

    const {
      data: store,
      error: storeError,
    } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        {
          success: false,
          message: "Store introuvable.",
        },
        { status: 404 }
      );
    }

    const storeId = store.id;

    // =====================================================
    // 4. ADMIN CLIENT
    // =====================================================

    const admin = getSupabaseAdmin();

    // =====================================================
    // 5. CONVERSATION
    // =====================================================

    const {
      data: conversation,
      error: conversationError,
    } = await admin
      .from("whatsapp_conversations")
      .select(
        "id, store_id, phone, customer_name"
      )
      .eq("id", conversation_id)
      .eq("store_id", storeId)
      .single();

    if (
      conversationError ||
      !conversation
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Conversation introuvable.",
        },
        { status: 404 }
      );
    }

    if (!conversation.phone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Numéro du client manquant.",
        },
        { status: 400 }
      );
    }

    const recipientPhone =
      normalizeMoroccanPhone(
        conversation.phone
      );

    if (!recipientPhone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Numéro de téléphone invalide.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 6. WHATSAPP CONNECTION
    // =====================================================

    const {
      data: connection,
      error: connectionError,
    } = await admin
      .from("whatsapp_connections")
      .select(
        "id, store_id, phone_number_id, waba_id, access_token, is_active"
      )
      .eq("store_id", storeId)
      .eq("is_active", true)
      .maybeSingle();

    if (connectionError) {
      console.error(
        "WhatsApp connection error:",
        connectionError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Impossible de récupérer la connexion WhatsApp.",
        },
        { status: 500 }
      );
    }

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Aucune connexion WhatsApp active.",
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

    // =====================================================
    // 7. META API
    // =====================================================

    const url =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${connection.phone_number_id}/messages`;

    const payload = {
      messaging_product: "whatsapp",

      to: recipientPhone,

      type: "text",

      text: {
        body: text,
      },
    };

    console.log(
      "======================================"
    );

    console.log(
      "===== WHATSAPP REPLY SEND ====="
    );

    console.log(
      "Conversation ID:",
      conversation.id
    );

    console.log(
      "Customer:",
      conversation.customer_name
    );

    console.log(
      "Phone:",
      recipientPhone
    );

    console.log(
      "Message:",
      text
    );

    console.log(
      "Phone Number ID:",
      connection.phone_number_id
    );

    console.log(
      "======================================"
    );

    const metaResponse = await fetch(
      url,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${connection.access_token}`,
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          payload
        ),

        cache: "no-store",
      }
    );

    const responseText =
      await metaResponse.text();

    let metaData: any;

    try {
      metaData =
        JSON.parse(responseText);
    } catch {
      metaData = {
        raw_response:
          responseText,
      };
    }

    console.log(
      "===== META REPLY RESPONSE ====="
    );

    console.log(
      JSON.stringify(
        metaData,
        null,
        2
      )
    );

    console.log(
      "HTTP STATUS:",
      metaResponse.status
    );

    // =====================================================
    // 8. META ERROR
    // =====================================================

    if (!metaResponse.ok) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Meta a refusé l'envoi du message.",

          meta_status:
            metaResponse.status,

          meta_response:
            metaData,
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // 9. WHATSAPP MESSAGE ID
    // =====================================================

    const whatsappMessageId =
      metaData?.messages?.[0]?.id ||
      null;

    // =====================================================
    // 10. SAVE OUTGOING MESSAGE
    // =====================================================

    const {
      data: savedMessage,
      error: saveMessageError,
    } = await admin
      .from("whatsapp_messages")
      .insert({
        conversation_id:
          conversation.id,

        store_id:
          storeId,

        whatsapp_message_id:
          whatsappMessageId,

        direction:
          "outgoing",

        message_type:
          "text",

        body: text,

        status:
          "sent",

        created_at:
          new Date().toISOString(),
      })
      .select(
        "id, conversation_id, whatsapp_message_id, direction, message_type, body, status, created_at"
      )
      .single();

    if (saveMessageError) {
      console.error(
        "Outgoing message save error:",
        saveMessageError
      );

      // Meta already accepted the message.
      // We return success but expose the DB warning.
      return NextResponse.json({
        success: true,

        warning:
          "Message WhatsApp envoyé, mais impossible de l'enregistrer dans l'historique.",

        order_id:
          conversation.id,

        recipient:
          recipientPhone,

        meta_response:
          metaData,
      });
    }

    // =====================================================
    // 11. UPDATE CONVERSATION
    // =====================================================

    const {
      error:
        conversationUpdateError,
    } = await admin
      .from(
        "whatsapp_conversations"
      )
      .update({
        last_message_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        conversation.id
      );

    if (
      conversationUpdateError
    ) {
      console.error(
        "Conversation update error:",
        conversationUpdateError
      );
    }

    // =====================================================
    // 12. SUCCESS
    // =====================================================

    return NextResponse.json({
      success: true,

      message:
        "Message WhatsApp envoyé avec succès.",

      recipient:
        recipientPhone,

      whatsapp_message_id:
        whatsappMessageId,

      saved_message:
        savedMessage,

      meta_response:
        metaData,
    });
  } catch (error) {
    console.error(
      "WhatsApp reply error:",
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