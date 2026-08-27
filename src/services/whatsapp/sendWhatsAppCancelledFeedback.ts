import type { SupabaseClient } from "@supabase/supabase-js";

const GRAPH_API_VERSION = "v26.0";
const TEMPLATE_NAME = "cancelled_feedback";
const TEMPLATE_LANGUAGE = "ar";

function normalizeMoroccanPhone(
  phone: string
) {
  let value = phone.replace(/\D/g, "");

  if (value.startsWith("0")) {
    value = "212" + value.slice(1);
  }

  return value;
}

type SendResult =
  | {
      state: "sent";
      run_id: string;
      conversation_id: number;
      outgoing_message_id: number | null;
      whatsapp_message_id: string | null;
    }
  | {
      state: "ignored";
      reason: string;
    }
  | {
      state: "failed";
      reason: string;
    };

export async function sendWhatsAppCancelledFeedback(
  admin: SupabaseClient,
  runId: string
): Promise<SendResult> {
  try {
    // =====================================================
    // 1. LOAD AUTOMATION RUN
    // =====================================================

    const {
      data: automationRun,
      error: runError,
    } = await admin
      .from("whatsapp_shipping_automation_runs")
      .select(`
        id,
        store_id,
        shipping_id,
        order_id,
        automation_key,
        trigger_status,
        conversation_id,
        outgoing_message_id,
        status,
        attempt_count,
        sent_at
      `)
      .eq("id", runId)
      .maybeSingle();

    if (runError || !automationRun) {
      console.error(
        "Cancelled Feedback run lookup failed:",
        runError
      );

      return {
        state: "failed",
        reason: "automation_run_not_found",
      };
    }

    // =====================================================
    // 2. VALIDATE RUN
    // =====================================================

    if (
      automationRun.automation_key !==
      "cancelled_feedback"
    ) {
      return {
        state: "ignored",
        reason: "wrong_automation_key",
      };
    }

    if (
      automationRun.status === "sent" ||
      automationRun.outgoing_message_id ||
      automationRun.sent_at
    ) {
      return {
        state: "ignored",
        reason: "already_sent",
      };
    }

    if (
      automationRun.status !== "pending"
    ) {
      return {
        state: "ignored",
        reason: "run_not_pending",
      };
    }

    // =====================================================
    // 3. RECHECK STORE SETTING
    // =====================================================

    const {
      data: settings,
      error: settingsError,
    } = await admin
      .from("whatsapp_automation_settings")
      .select("cancelled_feedback_enabled")
      .eq(
        "store_id",
        automationRun.store_id
      )
      .maybeSingle();

    if (settingsError) {
      console.error(
        "Cancelled Feedback settings lookup failed:",
        settingsError
      );

      await failRun(
        admin,
        automationRun.id,
        Number(
          automationRun.attempt_count || 0
        ),
        "settings_lookup_failed"
      );

      return {
        state: "failed",
        reason: "settings_lookup_failed",
      };
    }

    if (
      !settings?.cancelled_feedback_enabled
    ) {
      await admin
        .from(
          "whatsapp_shipping_automation_runs"
        )
        .update({
          status: "cancelled",
          last_error:
            "automation_disabled",
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          automationRun.id
        );

      return {
        state: "ignored",
        reason: "automation_disabled",
      };
    }

    // =====================================================
    // 4. REGISTER ATTEMPT
    // =====================================================

    const previousAttemptCount =
      Number(
        automationRun.attempt_count || 0
      );

    const nextAttemptCount =
      previousAttemptCount + 1;

    const {
      data: attemptRun,
      error: attemptError,
    } = await admin
      .from(
        "whatsapp_shipping_automation_runs"
      )
      .update({
        attempt_count:
          nextAttemptCount,
        last_error: null,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        automationRun.id
      )
      .eq(
        "status",
        "pending"
      )
      .eq(
        "attempt_count",
        previousAttemptCount
      )
      .select("id")
      .maybeSingle();

    if (attemptError) {
      console.error(
        "Cancelled Feedback attempt registration failed:",
        attemptError
      );

      return {
        state: "failed",
        reason: "attempt_update_failed",
      };
    }

    if (!attemptRun) {
      return {
        state: "ignored",
        reason: "attempt_already_started",
      };
    }

    // =====================================================
    // 5. LOAD SHIPMENT
    // =====================================================

    const {
      data: shipment,
      error: shipmentError,
    } = await admin
      .from("shipping")
      .select(`
        id,
        order_id,
        store_id,
        shipping_status,
        tracking_number,
        customer_name,
        customer_phone
      `)
      .eq(
        "id",
        automationRun.shipping_id
      )
      .eq(
        "store_id",
        automationRun.store_id
      )
      .eq(
        "order_id",
        automationRun.order_id
      )
      .maybeSingle();

    if (
      shipmentError ||
      !shipment
    ) {
      console.error(
        "Cancelled Feedback shipment lookup failed:",
        shipmentError
      );

      await failRun(
        admin,
        automationRun.id,
        nextAttemptCount,
        "shipment_not_found"
      );

      return {
        state: "failed",
        reason: "shipment_not_found",
      };
    }

    // =====================================================
    // 6. RECHECK CURRENT SHIPPING STATUS
    // =====================================================

    const currentShippingStatus =
      String(
        shipment.shipping_status || ""
      )
        .trim()
        .toLowerCase();

    if (
      currentShippingStatus !==
      "annulé".toLowerCase()
    ) {
      await admin
        .from(
          "whatsapp_shipping_automation_runs"
        )
        .update({
          status: "cancelled",
          last_error:
            "shipment_no_longer_cancelled",
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          automationRun.id
        );

      return {
        state: "ignored",
        reason:
          "shipment_no_longer_cancelled",
      };
    }

    // =====================================================
    // 7. LOAD ORDER AS FALLBACK
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
        phone
      `)
      .eq(
        "id",
        automationRun.order_id
      )
      .eq(
        "store_id",
        automationRun.store_id
      )
      .maybeSingle();

    if (orderError) {
      console.error(
        "Cancelled Feedback order lookup failed:",
        orderError
      );
    }

    const customerName =
      String(
        shipment.customer_name ||
          order?.name ||
          "عميلنا"
      ).trim();

    const rawPhone =
      shipment.customer_phone ||
      order?.phone ||
      "";

    const recipientPhone =
      normalizeMoroccanPhone(
        String(rawPhone)
      );

    if (!recipientPhone) {
      await failRun(
        admin,
        automationRun.id,
        nextAttemptCount,
        "customer_phone_missing"
      );

      return {
        state: "failed",
        reason:
          "customer_phone_missing",
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
      .eq(
        "store_id",
        automationRun.store_id
      )
      .eq(
        "is_active",
        true
      )
      .maybeSingle();

    if (
      connectionError ||
      !connection
    ) {
      console.error(
        "Cancelled Feedback WhatsApp connection lookup failed:",
        connectionError
      );

      await failRun(
        admin,
        automationRun.id,
        nextAttemptCount,
        "connection_not_found"
      );

      return {
        state: "failed",
        reason:
          "connection_not_found",
      };
    }

    if (
      !connection.phone_number_id ||
      !connection.access_token
    ) {
      await failRun(
        admin,
        automationRun.id,
        nextAttemptCount,
        "connection_incomplete"
      );

      return {
        state: "failed",
        reason:
          "connection_incomplete",
      };
    }

    // =====================================================
    // 9. FIND CONVERSATION BY ORDER
    // =====================================================

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
      .eq(
        "store_id",
        automationRun.store_id
      )
      .eq(
        "order_id",
        automationRun.order_id
      )
      .order(
        "updated_at",
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle();

    if (
      orderConversationError
    ) {
      console.error(
        "Cancelled Feedback order conversation lookup failed:",
        orderConversationError
      );

      await failRun(
        admin,
        automationRun.id,
        nextAttemptCount,
        "conversation_lookup_failed"
      );

      return {
        state: "failed",
        reason:
          "conversation_lookup_failed",
      };
    }

    let conversation =
      orderConversation;

    // =====================================================
    // 10. FALLBACK CONVERSATION BY PHONE
    // =====================================================

    if (!conversation) {
      const {
        data: phoneConversation,
        error: phoneConversationError,
      } = await admin
        .from(
          "whatsapp_conversations"
        )
        .select(`
          id,
          store_id,
          order_id,
          phone,
          customer_name
        `)
        .eq(
          "store_id",
          automationRun.store_id
        )
        .eq(
          "phone",
          recipientPhone
        )
        .order(
          "updated_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

      if (
        phoneConversationError
      ) {
        console.error(
          "Cancelled Feedback phone conversation lookup failed:",
          phoneConversationError
        );

        await failRun(
          admin,
          automationRun.id,
          nextAttemptCount,
          "conversation_lookup_failed"
        );

        return {
          state: "failed",
          reason:
            "conversation_lookup_failed",
        };
      }

      conversation =
        phoneConversation;
    }

    const now =
      new Date().toISOString();

    // =====================================================
    // 11. CREATE CONVERSATION IF NEEDED
    // =====================================================

    if (!conversation) {
      const {
        data: createdConversation,
        error:
          createConversationError,
      } = await admin
        .from(
          "whatsapp_conversations"
        )
        .insert({
          store_id:
            automationRun.store_id,

          order_id:
            automationRun.order_id,

          phone:
            recipientPhone,

          customer_name:
            customerName,

          last_message_at:
            now,

          unread_count: 0,

          created_at:
            now,

          updated_at:
            now,
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
          "Cancelled Feedback conversation creation failed:",
          createConversationError
        );

        await failRun(
          admin,
          automationRun.id,
          nextAttemptCount,
          "conversation_creation_failed"
        );

        return {
          state: "failed",
          reason:
            "conversation_creation_failed",
        };
      }

      conversation =
        createdConversation;
    }

    // =====================================================
    // 12. LINK CONVERSATION TO RUN
    // =====================================================

    const {
      error: runConversationError,
    } = await admin
      .from(
        "whatsapp_shipping_automation_runs"
      )
      .update({
        conversation_id:
          conversation.id,

        updated_at:
          now,
      })
      .eq(
        "id",
        automationRun.id
      );

    if (
      runConversationError
    ) {
      console.error(
        "Cancelled Feedback run conversation update failed:",
        runConversationError
      );
    }

    const {
      error: conversationLinkError,
    } = await admin
      .from(
        "whatsapp_conversations"
      )
      .update({
        order_id:
          automationRun.order_id,

        customer_name:
          conversation.customer_name ||
          customerName,

        updated_at:
          now,
      })
      .eq(
        "id",
        conversation.id
      );

    if (
      conversationLinkError
    ) {
      console.error(
        "Cancelled Feedback conversation link update failed:",
        conversationLinkError
      );
    }

    // =====================================================
    // 13. META TEMPLATE PAYLOAD
    // =====================================================

    const payload = {
      messaging_product:
        "whatsapp",

      to:
        recipientPhone,

      type:
        "template",

      template: {
        name:
          TEMPLATE_NAME,

        language: {
          code:
            TEMPLATE_LANGUAGE,
        },

        components: [
          {
            type:
              "body",

            parameters: [
              {
                type:
                  "text",

                parameter_name:
                  "customer_name",

                text:
                  customerName,
              },
            ],
          },
        ],
      },
    };

    const url =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${connection.phone_number_id}/messages`;

    // =====================================================
    // 14. SEND TO META
    //
    // Network error = uncertain result.
    // Never retry automatically in this case.
    // =====================================================

    let metaResponse: Response;

    try {
      metaResponse =
        await fetch(
          url,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${connection.access_token}`,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),

            cache:
              "no-store",
          }
        );
    } catch (fetchError) {
      const errorMessage =
        fetchError instanceof Error
          ? fetchError.message
          : String(fetchError);

      console.error(
        "Cancelled Feedback Meta network error:",
        fetchError
      );

      await failRun(
        admin,
        automationRun.id,
        nextAttemptCount,
        `meta_send_uncertain:${errorMessage}`
      );

      return {
        state: "failed",
        reason:
          "meta_send_uncertain",
      };
    }

    // =====================================================
    // 15. READ META RESPONSE
    // =====================================================

    const responseText =
      await metaResponse.text();

    let metaData: any;

    try {
      metaData =
        JSON.parse(
          responseText
        );
    } catch {
      metaData = {
        raw_response:
          responseText,
      };
    }

    console.log(
      "===== CANCELLED FEEDBACK META RESPONSE ====="
    );

    console.log(
      JSON.stringify(
        metaData,
        null,
        2
      )
    );

    // =====================================================
    // 16. META HTTP ERROR
    // =====================================================

    if (!metaResponse.ok) {
      console.error(
        "Cancelled Feedback Meta send failed:",
        metaResponse.status,
        metaData
      );

      const metaErrorMessage =
        metaData?.error?.message
          ? String(
              metaData.error.message
            )
          : "unknown_meta_error";

      const errorReason =
        `meta_http_${metaResponse.status}:` +
        metaErrorMessage;

      await failRun(
        admin,
        automationRun.id,
        nextAttemptCount,
        errorReason
      );

      return {
        state: "failed",
        reason:
          "meta_send_failed",
      };
    }

    // =====================================================
    // 17. META MESSAGE ID
    // =====================================================

    const whatsappMessageId =
      Array.isArray(
        metaData?.messages
      )
        ? metaData
            .messages?.[0]?.id ||
          null
        : null;

    // =====================================================
    // 18. LOCAL TEMPLATE BODY
    // =====================================================

    const templateBody =
      `مرحباً ${customerName} 👋\n\n` +
      `لاحظنا أن طلبكم تم تسجيله كطلب ملغى رغم وصوله إلى مدينتكم في الوقت المحدد.\n\n` +
      `يهمنا معرفة سبب إلغاء الطلب حتى نتمكن من تحسين جودة خدمتنا.\n\n` +
      `المرجو الرد على هذه الرسالة ومشاركتنا سبب إلغاء الطلب.\n\n` +
      `شكراً لتعاونكم.`;

    // =====================================================
    // 19. SAVE OUTGOING MESSAGE
    // =====================================================

    const {
      data: savedMessage,
      error: saveMessageError,
    } = await admin
      .from(
        "whatsapp_messages"
      )
      .insert({
        conversation_id:
          conversation.id,

        store_id:
          automationRun.store_id,

        whatsapp_message_id:
          whatsappMessageId,

        direction:
          "outgoing",

        message_type:
          "template",

        body:
          templateBody,

        media_id:
          null,

        media_url:
          null,

        media_mime_type:
          null,

        caption:
          null,

        status:
          "sent",

        created_at:
          now,
      })
      .select("id")
      .single();

    // =====================================================
    // 20. UPDATE CONVERSATION
    // =====================================================

    const {
      error: conversationUpdateError,
    } = await admin
      .from(
        "whatsapp_conversations"
      )
      .update({
        order_id:
          automationRun.order_id,

        customer_name:
          conversation.customer_name ||
          customerName,

        last_message_at:
          now,

        updated_at:
          now,
      })
      .eq(
        "id",
        conversation.id
      );

    if (
      conversationUpdateError
    ) {
      console.error(
        "Cancelled Feedback conversation update failed:",
        conversationUpdateError
      );
    }

    // =====================================================
    // 21. META SUCCESS + LOCAL HISTORY FAILURE
    //
    // Never retry: Meta already accepted the message.
    // =====================================================

    if (
      saveMessageError ||
      !savedMessage
    ) {
      console.error(
        "Cancelled Feedback outgoing history save failed:",
        saveMessageError
      );

      await admin
        .from(
          "whatsapp_shipping_automation_runs"
        )
        .update({
          status:
            "sent",

          conversation_id:
            conversation.id,

          outgoing_message_id:
            null,

          attempt_count:
            nextAttemptCount,

          last_error:
            "message_sent_but_history_save_failed",

          sent_at:
            now,

          updated_at:
            now,
        })
        .eq(
          "id",
          automationRun.id
        );

      return {
        state: "sent",

        run_id:
          automationRun.id,

        conversation_id:
          conversation.id,

        outgoing_message_id:
          null,

        whatsapp_message_id:
          whatsappMessageId,
      };
    }

    // =====================================================
    // 22. COMPLETE AUTOMATION RUN
    // =====================================================

    const {
      error: completeRunError,
    } = await admin
      .from(
        "whatsapp_shipping_automation_runs"
      )
      .update({
        status:
          "sent",

        conversation_id:
          conversation.id,

        outgoing_message_id:
          savedMessage.id,

        attempt_count:
          nextAttemptCount,

        last_error:
          null,

        sent_at:
          now,

        updated_at:
          now,
      })
      .eq(
        "id",
        automationRun.id
      );

    if (
      completeRunError
    ) {
      console.error(
        "Cancelled Feedback run completion failed:",
        completeRunError
      );
    }

    return {
      state: "sent",

      run_id:
        automationRun.id,

      conversation_id:
        conversation.id,

      outgoing_message_id:
        savedMessage.id,

      whatsapp_message_id:
        whatsappMessageId,
    };
  } catch (error) {
    console.error(
      "Unexpected Cancelled Feedback send error:",
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

// =======================================================
// MARK AUTOMATION RUN AS FAILED
// =======================================================

async function failRun(
  admin: SupabaseClient,
  runId: string,
  attemptCount: number,
  reason: string
) {
  const {
    error,
  } = await admin
    .from(
      "whatsapp_shipping_automation_runs"
    )
    .update({
      status:
        "failed",

      attempt_count:
        attemptCount,

      last_error:
        reason.slice(
          0,
          1000
        ),

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      runId
    );

  if (error) {
    console.error(
      "Cancelled Feedback run failure update failed:",
      error
    );
  }
}