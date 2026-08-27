import type { SupabaseClient } from "@supabase/supabase-js";

const GRAPH_API_VERSION = "v26.0";

const TEMPLATE_NAME =
  "refused_feedback";

const TEMPLATE_LANGUAGE =
  "ar";

function normalizeMoroccanPhone(
  phone: string
) {
  let value =
    phone.replace(/\D/g, "");

  if (value.startsWith("0")) {
    value =
      "212" + value.slice(1);
  }

  return value;
}

type SendResult =
  | {
      state: "sent";
      run_id: string;
      conversation_id: number;
      outgoing_message_id:
        number | null;
      whatsapp_message_id:
        string | null;
    }
  | {
      state: "ignored";
      reason: string;
    }
  | {
      state: "failed";
      reason: string;
    };

export async function sendWhatsAppRefusedFeedback(
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
      .from(
        "whatsapp_shipping_automation_runs"
      )
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
        attempt_count
      `)
      .eq(
        "id",
        runId
      )
      .maybeSingle();

    if (
      runError ||
      !automationRun
    ) {
      console.error(
        "Refused Feedback run lookup failed:",
        runError
      );

      return {
        state: "failed",
        reason:
          "automation_run_not_found",
      };
    }

    // This sender must only handle
    // refused_feedback runs.
    if (
      automationRun.automation_key !==
      "refused_feedback"
    ) {
      return {
        state: "ignored",
        reason:
          "wrong_automation_key",
      };
    }

    // Never send the same run again.
    if (
      automationRun.status ===
        "sent" ||
      automationRun.outgoing_message_id
    ) {
      return {
        state: "ignored",
        reason:
          "already_sent",
      };
    }

    if (
      automationRun.status !==
      "pending"
    ) {
      return {
        state: "ignored",
        reason:
          "run_not_pending",
      };
    }

    // =====================================================
    // 2. RECHECK STORE SETTING
    // =====================================================

    const {
      data: settings,
      error: settingsError,
    } = await admin
      .from(
        "whatsapp_automation_settings"
      )
      .select(
        "refused_feedback_enabled"
      )
      .eq(
        "store_id",
        automationRun.store_id
      )
      .maybeSingle();

    if (settingsError) {
      console.error(
        "Refused Feedback settings lookup failed:",
        settingsError
      );

      return {
        state: "failed",
        reason:
          "settings_lookup_failed",
      };
    }

    if (
      !settings?.refused_feedback_enabled
    ) {
      const now =
        new Date().toISOString();

      await admin
        .from(
          "whatsapp_shipping_automation_runs"
        )
        .update({
          status: "cancelled",
          last_error:
            "automation_disabled",
          updated_at: now,
        })
        .eq(
          "id",
          automationRun.id
        );

      return {
        state: "ignored",
        reason:
          "automation_disabled",
      };
    }

    // =====================================================
    // 3. LOAD SHIPMENT
    // =====================================================
    //
    // Important:
    // For shipping automations we use the customer
    // snapshot saved on the shipment first.
    //
    // This is safer than relying only on orders because
    // the shipment represents the actual parcel that
    // reached the delivery flow.
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
        "Refused Feedback shipment lookup failed:",
        shipmentError
      );

      await markRunFailed(
        admin,
        automationRun.id,
        Number(
          automationRun.attempt_count ||
            0
        ),
        "shipment_not_found"
      );

      return {
        state: "failed",
        reason:
          "shipment_not_found",
      };
    }

    // =====================================================
    // 4. LOAD ORDER AS FALLBACK
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
        "Refused Feedback order lookup failed:",
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
      await markRunFailed(
        admin,
        automationRun.id,
        Number(
          automationRun.attempt_count ||
            0
        ),
        "customer_phone_missing"
      );

      return {
        state: "failed",
        reason:
          "customer_phone_missing",
      };
    }

    // =====================================================
    // 5. ACTIVE WHATSAPP CONNECTION
    // =====================================================

    const {
      data: connection,
      error: connectionError,
    } = await admin
      .from(
        "whatsapp_connections"
      )
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
        "Refused Feedback WhatsApp connection lookup failed:",
        connectionError
      );

      await markRunFailed(
        admin,
        automationRun.id,
        Number(
          automationRun.attempt_count ||
            0
        ),
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
      await markRunFailed(
        admin,
        automationRun.id,
        Number(
          automationRun.attempt_count ||
            0
        ),
        "connection_incomplete"
      );

      return {
        state: "failed",
        reason:
          "connection_incomplete",
      };
    }

    // =====================================================
    // 6. FIND / CREATE CONVERSATION
    // =====================================================

    const {
      data: orderConversation,
      error:
        orderConversationError,
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
        "Refused Feedback order conversation lookup failed:",
        orderConversationError
      );

      return {
        state: "failed",
        reason:
          "conversation_lookup_failed",
      };
    }

    let conversation =
      orderConversation;

    if (!conversation) {
      const {
        data: phoneConversation,
        error:
          phoneConversationError,
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
          "Refused Feedback phone conversation lookup failed:",
          phoneConversationError
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

    if (!conversation) {
      const {
        data:
          createdConversation,
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
          "Refused Feedback conversation creation failed:",
          createConversationError
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

    // Keep the conversation linked to
    // the shipment's order.
    const {
      error:
        conversationLinkError,
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
        "Refused Feedback conversation link update failed:",
        conversationLinkError
      );
    }

    // =====================================================
    // 7. REGISTER SEND ATTEMPT
    // =====================================================

    const nextAttemptCount =
      Number(
        automationRun.attempt_count ||
          0
      ) + 1;

    const {
      error: attemptError,
    } = await admin
      .from(
        "whatsapp_shipping_automation_runs"
      )
      .update({
        attempt_count:
          nextAttemptCount,

        conversation_id:
          conversation.id,

        updated_at:
          now,
      })
      .eq(
        "id",
        automationRun.id
      )
      .eq(
        "status",
        "pending"
      );

    if (attemptError) {
      console.error(
        "Refused Feedback attempt update failed:",
        attemptError
      );

      return {
        state: "failed",
        reason:
          "attempt_update_failed",
      };
    }

    // =====================================================
    // 8. META TEMPLATE PAYLOAD
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
    // 9. SEND TO META
    // =====================================================

    const metaResponse =
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
      "===== REFUSED FEEDBACK META RESPONSE ====="
    );

    console.log(
      JSON.stringify(
        metaData,
        null,
        2
      )
    );

    if (
      !metaResponse.ok
    ) {
      console.error(
        "Refused Feedback Meta send failed:",
        metaResponse.status,
        metaData
      );

      const metaError =
        metaData?.error?.message
          ? String(
              metaData.error.message
            )
          : `meta_http_${metaResponse.status}`;

      await markRunFailed(
        admin,
        automationRun.id,
        nextAttemptCount,
        metaError
      );

      return {
        state: "failed",
        reason:
          "meta_send_failed",
      };
    }

    // =====================================================
    // 10. META MESSAGE ID
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
    // 11. SAVE OUTGOING WHATSAPP MESSAGE
    // =====================================================

    const templateBody =
      `مرحباً ${customerName} 👋\n\n` +
      `لاحظنا أن طلبكم تم تسجيله كطلب مرفوض.\n\n` +
      `يهمنا معرفة سبب عدم استلام الطلب حتى نتمكن من تحسين جودة خدمتنا.\n\n` +
      `المرجو الرد على هذه الرسالة وشرح السبب باختصار.\n\n` +
      `شكراً لتعاونكم.`;

    const {
      data:
        savedMessage,
      error:
        saveMessageError,
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
    // 12. UPDATE CONVERSATION
    // =====================================================

    const {
      error:
        conversationUpdateError,
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
        "Refused Feedback conversation update failed:",
        conversationUpdateError
      );
    }

    // =====================================================
    // 13. META SEND SUCCEEDED BUT LOCAL MESSAGE SAVE FAILED
    // =====================================================
    //
    // IMPORTANT:
    // Do NOT retry automatically here.
    // Meta already accepted the message and retrying could
    // send the customer a duplicate.
    // =====================================================

    if (
      saveMessageError ||
      !savedMessage
    ) {
      console.error(
        "Refused Feedback outgoing history save failed:",
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
    // 14. COMPLETE AUTOMATION RUN
    // =====================================================

    const {
      error:
        completeRunError,
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
        "Refused Feedback run completion failed:",
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
      "Unexpected Refused Feedback send error:",
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
// MARK RUN FAILED
// =======================================================

async function markRunFailed(
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
      "Refused Feedback run failure update failed:",
      error
    );
  }
}