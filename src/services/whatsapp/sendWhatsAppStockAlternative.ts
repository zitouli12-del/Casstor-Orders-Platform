import type { SupabaseClient } from "@supabase/supabase-js";

const GRAPH_API_VERSION = "v26.0";
const TEMPLATE_LANGUAGE = "ar";

function normalizeMoroccanPhone(phone: string) {
  let value = phone.replace(/\D/g, "");

  if (value.startsWith("0")) {
    value = "212" + value.slice(1);
  }

  return value;
}

type SendResult =
  | {
      state: "sent";
      whatsapp_message_id: string | null;
      conversation_id: number;
    }
  | {
      state: "failed";
      reason: string;
    };

export async function sendWhatsAppStockAlternative(
  admin: SupabaseClient,
  requestId: string
): Promise<SendResult> {
  try {
    // =====================================================
    // 1. LOAD REQUEST
    // =====================================================

    const { data: stockRequest, error: requestError } = await admin
      .from("whatsapp_stock_alternative_requests")
      .select(`
        id,
        store_id,
        order_id,
        original_color,
        original_size,
        available_variant_ids,
        status,
        whatsapp_message_id
      `)
      .eq("id", requestId)
      .single();

    if (requestError || !stockRequest) {
      console.error(
        "Stock Alternative request lookup failed:",
        requestError
      );

      return {
        state: "failed",
        reason: "request_not_found",
      };
    }

    // Prevent double send
    if (stockRequest.whatsapp_message_id) {
      return {
        state: "failed",
        reason: "already_sent",
      };
    }

    // =====================================================
    // 2. LOAD ORDER
    // =====================================================

    const { data: order, error: orderError } = await admin
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
      .eq("id", stockRequest.order_id)
      .eq("store_id", stockRequest.store_id)
      .single();

    if (orderError || !order) {
      console.error(
        "Stock Alternative order lookup failed:",
        orderError
      );

      return {
        state: "failed",
        reason: "order_not_found",
      };
    }

    if (
      !order.phone ||
      !order.name ||
      !order.product ||
      !order.size
    ) {
      return {
        state: "failed",
        reason: "order_data_missing",
      };
    }

    // =====================================================
    // 3. LOAD ALTERNATIVE VARIANTS
    // =====================================================

    const variantIds = Array.isArray(
      stockRequest.available_variant_ids
    )
      ? stockRequest.available_variant_ids
          .map((id: unknown) => Number(id))
          .filter((id: number) => Number.isFinite(id))
          .slice(0, 3)
      : [];

    if (variantIds.length === 0) {
      return {
        state: "failed",
        reason: "no_variants",
      };
    }

    const { data: variants, error: variantsError } = await admin
      .from("stock_variants")
      .select(`
        id,
        color,
        size,
        image_url,
        quantity
      `)
      .in("id", variantIds);

    if (variantsError || !variants) {
      console.error(
        "Stock Alternative variants lookup failed:",
        variantsError
      );

      return {
        state: "failed",
        reason: "variants_lookup_failed",
      };
    }

    // Preserve the order stored in available_variant_ids
    const orderedVariants = variantIds
      .map((id) =>
        variants.find(
          (variant) => Number(variant.id) === Number(id)
        )
      )
      .filter(Boolean) as typeof variants;

    if (orderedVariants.length === 0) {
      return {
        state: "failed",
        reason: "no_valid_variants",
      };
    }

    // =====================================================
    // 4. TEMPLATE SELECTION
    // =====================================================

    const count = orderedVariants.length;

    const templateName =
      count === 1
        ? "stock_alternative_1"
        : count === 2
        ? "stock_alternative_2"
        : "stock_alternative";

    // =====================================================
    // 5. WHATSAPP CONNECTION
    // =====================================================

    const { data: connection, error: connectionError } =
      await admin
        .from("whatsapp_connections")
        .select(`
          id,
          store_id,
          phone_number_id,
          access_token,
          is_active
        `)
        .eq("store_id", stockRequest.store_id)
        .eq("is_active", true)
        .maybeSingle();

    if (connectionError || !connection) {
      console.error(
        "WhatsApp connection lookup failed:",
        connectionError
      );

      return {
        state: "failed",
        reason: "connection_not_found",
      };
    }

    if (
      !connection.phone_number_id ||
      !connection.access_token
    ) {
      return {
        state: "failed",
        reason: "connection_incomplete",
      };
    }

    // =====================================================
    // 6. PHONE
    // =====================================================

    const recipientPhone = normalizeMoroccanPhone(
      String(order.phone)
    );

    if (!recipientPhone) {
      return {
        state: "failed",
        reason: "invalid_phone",
      };
    }

    // =====================================================
    // 7. CONVERSATION
    // =====================================================

    const {
      data: existingOrderConversation,
      error: orderConversationError,
    } = await admin
      .from("whatsapp_conversations")
      .select(`
        id,
        store_id,
        order_id,
        phone,
        customer_name
      `)
      .eq("store_id", stockRequest.store_id)
      .eq("order_id", order.id)
      .maybeSingle();

    if (orderConversationError) {
      console.error(
        "Order conversation lookup failed:",
        orderConversationError
      );

      return {
        state: "failed",
        reason: "conversation_lookup_failed",
      };
    }

    let conversation = existingOrderConversation;

    if (!conversation) {
      const {
        data: phoneConversation,
        error: phoneConversationError,
      } = await admin
        .from("whatsapp_conversations")
        .select(`
          id,
          store_id,
          order_id,
          phone,
          customer_name
        `)
        .eq("store_id", stockRequest.store_id)
        .eq("phone", recipientPhone)
        .maybeSingle();

      if (phoneConversationError) {
        console.error(
          "Phone conversation lookup failed:",
          phoneConversationError
        );

        return {
          state: "failed",
          reason: "conversation_lookup_failed",
        };
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
          store_id: stockRequest.store_id,
          order_id: order.id,
          phone: recipientPhone,
          customer_name: order.name,
          last_message_at: now,
          unread_count: 0,
          created_at: now,
          updated_at: now,
        })
        .select(`
          id,
          store_id,
          order_id,
          phone,
          customer_name
        `)
        .single();

      if (
        createConversationError ||
        !createdConversation
      ) {
        console.error(
          "Conversation creation failed:",
          createConversationError
        );

        return {
          state: "failed",
          reason: "conversation_creation_failed",
        };
      }

      conversation = createdConversation;
    }

    // Keep conversation linked to current order
    await admin
      .from("whatsapp_conversations")
      .update({
        order_id: order.id,
        customer_name:
          conversation.customer_name || order.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);

    // =====================================================
    // 8. BODY PARAMETERS
    // =====================================================

    const bodyParameters: Array<{
      type: "text";
      parameter_name: string;
      text: string;
    }> = [
      {
        type: "text",
        parameter_name: "customer_name",
        text: String(order.name).trim(),
      },
      {
        type: "text",
        parameter_name: "requested_color",
        text: String(stockRequest.original_color).trim(),
      },
      {
        type: "text",
        parameter_name: "product_name",
        text: String(order.product).trim(),
      },
      {
        type: "text",
        parameter_name: "size",
        text: String(stockRequest.original_size || order.size).trim(),
      },
    ];

    orderedVariants.forEach((variant, index) => {
      bodyParameters.push({
        type: "text",
        parameter_name: `option_${index + 1}`,
        text: String(variant.color).trim(),
      });
    });

    // =====================================================
    // 9. BUTTON PAYLOADS
    // =====================================================

    const buttonComponents = orderedVariants.map(
      (variant, index) => ({
        type: "button",
        sub_type: "quick_reply",
        index: String(index),
        parameters: [
          {
            type: "payload",
            payload:
              `stock_alt:${stockRequest.id}:${variant.id}`,
          },
        ],
      })
    );

    // Meta supports quick-reply payload parameters on
    // approved interactive message templates.
    // =====================================================
    // 10. IMAGE
    // =====================================================

    const imageUrl =
      orderedVariants[0]?.image_url || null;

    if (!imageUrl) {
      return {
        state: "failed",
        reason: "image_missing",
      };
    }

    // =====================================================
    // 11. META PAYLOAD
    // =====================================================

    const payload = {
      messaging_product: "whatsapp",

      to: recipientPhone,

      type: "template",

      template: {
        name: templateName,

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
                  link: imageUrl,
                },
              },
            ],
          },

          {
            type: "body",

            parameters: bodyParameters,
          },

          ...buttonComponents,
        ],
      },
    };

    const url =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${connection.phone_number_id}/messages`;

    // =====================================================
    // 12. SEND TO META
    // =====================================================

    const metaResponse = await fetch(url, {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${connection.access_token}`,

        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),

      cache: "no-store",
    });

    const responseText =
      await metaResponse.text();

    let metaData: any;

    try {
      metaData = JSON.parse(responseText);
    } catch {
      metaData = {
        raw_response: responseText,
      };
    }

    console.log(
      "===== STOCK ALTERNATIVE META RESPONSE ====="
    );

    console.log(
      JSON.stringify(metaData, null, 2)
    );

    if (!metaResponse.ok) {
      console.error(
        "Stock Alternative Meta send failed:",
        metaResponse.status,
        metaData
      );

      return {
        state: "failed",
        reason: "meta_send_failed",
      };
    }

    // =====================================================
    // 13. META MESSAGE ID
    // =====================================================

    const whatsappMessageId =
      Array.isArray(metaData?.messages)
        ? metaData.messages?.[0]?.id || null
        : null;

    // =====================================================
    // 14. SAVE OUTGOING HISTORY
    // =====================================================

    const optionsText = orderedVariants
      .map(
        (variant, index) =>
          `${index + 1}️⃣ ${variant.color}`
      )
      .join("\n");

    const templateBody =
      `مرحبا ${String(order.name).trim()} 👋\n\n` +
      `اللون ${String(stockRequest.original_color).trim()} ` +
      `من طلبكم ${String(order.product).trim()} / ` +
      `${String(stockRequest.original_size || order.size).trim()} ` +
      `ما بقاش متوفر.\n\n` +
      `لكن نفس المنتج ونفس المقاس متوفر بالألوان التالية ✅\n\n` +
      `${optionsText}\n\n` +
      `اختار اللون المناسب ليك من الاختيارات التالية 👇`;

    const now = new Date().toISOString();

    const {
      error: saveMessageError,
    } = await admin
      .from("whatsapp_messages")
      .insert({
        conversation_id: conversation.id,
        store_id: stockRequest.store_id,
        whatsapp_message_id: whatsappMessageId,
        direction: "outgoing",
        message_type: "template",
        body: templateBody,
        media_id: null,
        media_mime_type: "image/jpeg",

        // Same convention already used by the current
        // missed_call_confirmation route.
        caption: imageUrl,

        status: "sent",
        created_at: now,
      });

    if (saveMessageError) {
      console.error(
        "Stock Alternative outgoing history save failed:",
        saveMessageError
      );
    }

    // =====================================================
    // 15. UPDATE CONVERSATION
    // =====================================================

    await admin
      .from("whatsapp_conversations")
      .update({
        order_id: order.id,
        customer_name:
          conversation.customer_name || order.name,
        last_message_at: now,
        updated_at: now,
      })
      .eq("id", conversation.id);

    // =====================================================
    // 16. UPDATE STOCK ALTERNATIVE REQUEST
    // =====================================================

    const {
      error: updateRequestError,
    } = await admin
      .from("whatsapp_stock_alternative_requests")
      .update({
        whatsapp_conversation_id:
          conversation.id,

        whatsapp_message_id:
          whatsappMessageId,

        updated_at: now,
      })
      .eq("id", stockRequest.id);

    if (updateRequestError) {
      console.error(
        "Stock Alternative request update failed:",
        updateRequestError
      );
    }

    return {
      state: "sent",
      whatsapp_message_id:
        whatsappMessageId,
      conversation_id:
        conversation.id,
    };
  } catch (error) {
    console.error(
      "Unexpected Stock Alternative send error:",
      error
    );

    return {
      state: "failed",
      reason:
        error instanceof Error
          ? error.message
          : "unexpected_error",
    };
  }
}