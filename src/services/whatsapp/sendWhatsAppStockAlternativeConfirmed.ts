import type { SupabaseClient } from "@supabase/supabase-js";

const GRAPH_API_VERSION = "v26.0";
const TEMPLATE_NAME = "stock_alternative_confirmed";
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
      state: "ignored";
      reason: string;
    }
  | {
      state: "failed";
      reason: string;
    };

export async function sendWhatsAppStockAlternativeConfirmed(
  admin: SupabaseClient,
  requestId: string
): Promise<SendResult> {
  try {
    // =====================================================
    // 1. LOAD COMPLETED STOCK ALTERNATIVE REQUEST
    // =====================================================

    const {
      data: stockRequest,
      error: requestError,
    } = await admin
      .from("whatsapp_stock_alternative_requests")
      .select(`
        id,
        store_id,
        order_id,
        selected_variant_id,
        status,
        whatsapp_conversation_id,
        confirmation_whatsapp_message_id,
        confirmation_sent_at,
        confirmation_last_error
      `)
      .eq("id", requestId)
      .maybeSingle();

    if (requestError || !stockRequest) {
      console.error(
        "Stock Alternative Confirmed request lookup failed:",
        requestError
      );

      return {
        state: "failed",
        reason: "request_not_found",
      };
    }

    // =====================================================
    // 2. REQUEST MUST BE COMPLETED
    // =====================================================

    if (stockRequest.status !== "completed") {
      return {
        state: "ignored",
        reason: "request_not_completed",
      };
    }

    if (!stockRequest.selected_variant_id) {
      return {
        state: "failed",
        reason: "selected_variant_missing",
      };
    }

    // =====================================================
    // 3. NEVER SEND THE CONFIRMATION TWICE
    // =====================================================

    if (
      stockRequest.confirmation_sent_at ||
      stockRequest.confirmation_whatsapp_message_id
    ) {
      return {
        state: "ignored",
        reason: "confirmation_already_sent",
      };
    }

    const previousConfirmationError = String(
      stockRequest.confirmation_last_error || ""
    );

    // A network failure after starting the Meta request is uncertain:
    // Meta may already have accepted the message. Never auto-retry it.
    if (
      previousConfirmationError.startsWith(
        "meta_send_uncertain:"
      )
    ) {
      return {
        state: "ignored",
        reason: "meta_send_result_uncertain",
      };
    }

    // Another execution already acquired the send claim.
    if (
      previousConfirmationError.startsWith(
        "sending:"
      )
    ) {
      return {
        state: "ignored",
        reason: "confirmation_send_already_in_progress",
      };
    }

    // =====================================================
    // 4. RECHECK STOCK ALTERNATIVES MASTER SETTING
    // =====================================================

    const {
      data: settings,
      error: settingsError,
    } = await admin
      .from("whatsapp_automation_settings")
      .select("stock_alternatives_enabled")
      .eq("store_id", stockRequest.store_id)
      .maybeSingle();

    if (settingsError) {
      console.error(
        "Stock Alternative Confirmed settings lookup failed:",
        settingsError
      );

      return {
        state: "failed",
        reason: "settings_lookup_failed",
      };
    }

    if (!settings?.stock_alternatives_enabled) {
      return {
        state: "ignored",
        reason: "automation_disabled",
      };
    }

    // =====================================================
    // 5. LOAD ORDER
    // =====================================================

    const {
      data: order,
      error: orderError,
    } = await admin
      .from("orders")
      .select(`
        id,
        store_id,
        name,
        phone,
        product,
        color,
        size
      `)
      .eq("id", stockRequest.order_id)
      .eq("store_id", stockRequest.store_id)
      .maybeSingle();

    if (orderError || !order) {
      console.error(
        "Stock Alternative Confirmed order lookup failed:",
        orderError
      );

      return {
        state: "failed",
        reason: "order_not_found",
      };
    }

    if (!order.phone) {
      return {
        state: "failed",
        reason: "order_phone_missing",
      };
    }

    // =====================================================
    // 6. LOAD SELECTED VARIANT
    // =====================================================

    const {
      data: selectedVariant,
      error: variantError,
    } = await admin
      .from("stock_variants")
      .select(`
        id,
        color,
        size,
        product_id
      `)
      .eq("id", stockRequest.selected_variant_id)
      .maybeSingle();

    if (variantError || !selectedVariant) {
      console.error(
        "Stock Alternative Confirmed selected variant lookup failed:",
        variantError
      );

      return {
        state: "failed",
        reason: "selected_variant_not_found",
      };
    }

    const selectedColor = String(
      selectedVariant.color || ""
    ).trim();

    if (!selectedColor) {
      return {
        state: "failed",
        reason: "selected_color_missing",
      };
    }

    // The selection handler already changed only orders.color.
    // Recheck it before confirming that color to the customer.
    if (
      String(order.color || "")
        .trim()
        .toLowerCase() !== selectedColor.toLowerCase()
    ) {
      return {
        state: "ignored",
        reason: "order_color_changed_after_selection",
      };
    }

    // =====================================================
    // 7. NORMALIZE CUSTOMER PHONE
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
    // 8. LOAD ACTIVE WHATSAPP CONNECTION
    // =====================================================

    const {
      data: connection,
      error: connectionError,
    } = await admin
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
        "Stock Alternative Confirmed WhatsApp connection lookup failed:",
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

    // Keep these narrowed as strings for nested async code / fetch.
    const phoneNumberId = connection.phone_number_id;
    const accessToken = connection.access_token;

    // =====================================================
    // 9. LOAD CONVERSATION
    // Prefer the exact conversation saved by the selection handler.
    // =====================================================

    let conversation: {
      id: number;
      store_id: number;
      order_id: number | null;
      phone: string;
      customer_name: string | null;
    } | null = null;

    if (stockRequest.whatsapp_conversation_id) {
      const {
        data: requestConversation,
        error: requestConversationError,
      } = await admin
        .from("whatsapp_conversations")
        .select(`
          id,
          store_id,
          order_id,
          phone,
          customer_name
        `)
        .eq("id", stockRequest.whatsapp_conversation_id)
        .eq("store_id", stockRequest.store_id)
        .maybeSingle();

      if (requestConversationError) {
        console.error(
          "Stock Alternative Confirmed request conversation lookup failed:",
          requestConversationError
        );
      }

      conversation = requestConversation;
    }

    // Fallback by current order.
    if (!conversation) {
      const {
        data: orderConversation,
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
          "Stock Alternative Confirmed order conversation lookup failed:",
          orderConversationError
        );
      }

      conversation = orderConversation;
    }

    // Fallback by phone.
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
          "Stock Alternative Confirmed phone conversation lookup failed:",
          phoneConversationError
        );
      }

      conversation = phoneConversation;
    }

    const now = new Date().toISOString();

    // It should already exist because the client replied to the
    // Stock Alternatives template, but keep a safe fallback.
    if (!conversation) {
      const {
        data: createdConversation,
        error: createConversationError,
      } = await admin
        .from("whatsapp_conversations")
        .insert({
          store_id: stockRequest.store_id,
          order_id: order.id,
          phone: recipientPhone,
          customer_name: order.name || null,
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
          "Stock Alternative Confirmed conversation creation failed:",
          createConversationError
        );

        return {
          state: "failed",
          reason: "conversation_creation_failed",
        };
      }

      conversation = createdConversation;
    }

    // =====================================================
    // 10. ACQUIRE A SEND CLAIM
    // Protects against two webhook executions sending the same
    // final confirmation at the same time.
    // =====================================================

    const claimToken =
      `sending:${Date.now()}:` +
      Math.random().toString(36).slice(2);

    let claimQuery = admin
      .from("whatsapp_stock_alternative_requests")
      .update({
        confirmation_last_error: claimToken,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stockRequest.id)
      .eq("status", "completed")
      .is("confirmation_sent_at", null)
      .is("confirmation_whatsapp_message_id", null);

    if (previousConfirmationError) {
      claimQuery = claimQuery.eq(
        "confirmation_last_error",
        previousConfirmationError
      );
    } else {
      claimQuery = claimQuery.is(
        "confirmation_last_error",
        null
      );
    }

    const {
      data: claimedRequest,
      error: claimError,
    } = await claimQuery
      .select("id")
      .maybeSingle();

    if (claimError) {
      console.error(
        "Stock Alternative Confirmed send claim failed:",
        claimError
      );

      return {
        state: "failed",
        reason: "confirmation_claim_failed",
      };
    }

    if (!claimedRequest) {
      return {
        state: "ignored",
        reason: "confirmation_send_not_acquired",
      };
    }

    // =====================================================
    // 11. META TEMPLATE PAYLOAD
    // =====================================================

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
            type: "body",
            parameters: [
              {
                type: "text",
                parameter_name: "selected_color",
                text: selectedColor,
              },
            ],
          },
        ],
      },
    };

    const url =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${phoneNumberId}/messages`;

    // =====================================================
    // 12. SEND TO META
    // =====================================================

    let metaResponse: Response;

    try {
      metaResponse = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
    } catch (fetchError) {
      const errorMessage =
        fetchError instanceof Error
          ? fetchError.message
          : String(fetchError);

      console.error(
        "Stock Alternative Confirmed Meta network error:",
        fetchError
      );

      await admin
        .from("whatsapp_stock_alternative_requests")
        .update({
          confirmation_last_error:
            `meta_send_uncertain:${errorMessage}`.slice(
              0,
              1000
            ),
          updated_at: new Date().toISOString(),
        })
        .eq("id", stockRequest.id)
        .eq("confirmation_last_error", claimToken);

      return {
        state: "failed",
        reason: "meta_send_uncertain",
      };
    }

    const responseText = await metaResponse.text();

    let metaData: any;

    try {
      metaData = JSON.parse(responseText);
    } catch {
      metaData = {
        raw_response: responseText,
      };
    }

    console.log(
      "===== STOCK ALTERNATIVE CONFIRMED META RESPONSE ====="
    );

    console.log(
      JSON.stringify(metaData, null, 2)
    );

    // =====================================================
    // 13. CLEAR META HTTP ERROR = SAFE TO RETRY LATER
    // =====================================================

    if (!metaResponse.ok) {
      const metaErrorMessage = metaData?.error?.message
        ? String(metaData.error.message)
        : "unknown_meta_error";

      const errorReason =
        `meta_http_${metaResponse.status}:` +
        metaErrorMessage;

      console.error(
        "Stock Alternative Confirmed Meta send failed:",
        metaResponse.status,
        metaData
      );

      await admin
        .from("whatsapp_stock_alternative_requests")
        .update({
          confirmation_last_error: errorReason.slice(
            0,
            1000
          ),
          updated_at: new Date().toISOString(),
        })
        .eq("id", stockRequest.id)
        .eq("confirmation_last_error", claimToken);

      return {
        state: "failed",
        reason: "meta_send_failed",
      };
    }

    // =====================================================
    // 14. META ACCEPTED THE MESSAGE
    // From this point onward we MUST NEVER resend it.
    // =====================================================

    const whatsappMessageId = Array.isArray(
      metaData?.messages
    )
      ? metaData.messages?.[0]?.id || null
      : null;

    const sentAt = new Date().toISOString();

    // =====================================================
    // 15. SAVE OUTGOING MESSAGE IN WHATSAPP HISTORY
    // Match the columns already used by the current sender.
    // =====================================================

    const templateBody =
      `تم تغيير لون طلبكم إلى ${selectedColor} ✅\n\n` +
      `سيتصل بكم فريقنا خلال 24 ساعة لتأكيد الطلب.\n\n` +
      `شكراً لكم.`;

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
        media_mime_type: null,
        caption: null,
        status: "sent",
        created_at: sentAt,
      });

    if (saveMessageError) {
      console.error(
        "Stock Alternative Confirmed outgoing history save failed:",
        saveMessageError
      );
    }

    // =====================================================
    // 16. MARK CONFIRMATION AS SENT
    // Do this even if local whatsapp_messages history failed,
    // because Meta already accepted the customer message.
    // =====================================================

    const {
      error: completeConfirmationError,
    } = await admin
      .from("whatsapp_stock_alternative_requests")
      .update({
        confirmation_whatsapp_message_id:
          whatsappMessageId,
        confirmation_sent_at: sentAt,
        confirmation_last_error: saveMessageError
          ? "message_sent_but_history_save_failed"
          : null,
        updated_at: sentAt,
      })
      .eq("id", stockRequest.id)
      .eq("confirmation_last_error", claimToken);

    if (completeConfirmationError) {
      console.error(
        "Stock Alternative Confirmed final request update failed:",
        completeConfirmationError
      );
    }

    // =====================================================
    // 17. UPDATE CONVERSATION
    // =====================================================

    const {
      error: conversationUpdateError,
    } = await admin
      .from("whatsapp_conversations")
      .update({
        order_id: order.id,
        customer_name:
          conversation.customer_name ||
          order.name ||
          null,
        last_message_at: sentAt,
        updated_at: sentAt,
      })
      .eq("id", conversation.id);

    if (conversationUpdateError) {
      console.error(
        "Stock Alternative Confirmed conversation update failed:",
        conversationUpdateError
      );
    }

    console.log(
      "===== STOCK ALTERNATIVE CONFIRMATION SENT ====="
    );

    console.log({
      request_id: stockRequest.id,
      order_id: order.id,
      selected_color: selectedColor,
      whatsapp_message_id: whatsappMessageId,
    });

    return {
      state: "sent",
      whatsapp_message_id: whatsappMessageId,
      conversation_id: Number(conversation.id),
    };
  } catch (error) {
    console.error(
      "Unexpected Stock Alternative Confirmed send error:",
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