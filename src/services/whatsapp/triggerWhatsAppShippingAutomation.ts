import type { SupabaseClient } from "@supabase/supabase-js";

import { sendWhatsAppRefusedFeedback } from "./sendWhatsAppRefusedFeedback";

const MAX_ATTEMPTS = 3;

type AutomationKey =
  | "refused_feedback";

type TriggerResult =
  | {
      state: "sent";
      automation_key: string;
      run_id: string;
    }
  | {
      state: "ignored";
      reason: string;
      automation_key?: string;
      run_id?: string;
    }
  | {
      state: "failed";
      reason: string;
      automation_key?: string;
      run_id?: string;
    };

function normalizeValue(
  value: string | null | undefined
) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

// =======================================================
// EXECUTE AUTOMATION
// =======================================================

async function executeAutomation(
  admin: SupabaseClient,
  params: {
    runId: string;
    automationKey: AutomationKey;
  }
): Promise<TriggerResult> {
  if (
    params.automationKey ===
    "refused_feedback"
  ) {
    const sendResult =
      await sendWhatsAppRefusedFeedback(
        admin,
        params.runId
      );

    console.log(
      "Refused Feedback automation result:",
      sendResult
    );

    if (
      sendResult.state ===
      "sent"
    ) {
      return {
        state: "sent",
        automation_key:
          params.automationKey,
        run_id:
          params.runId,
      };
    }

    if (
      sendResult.state ===
      "ignored"
    ) {
      return {
        state: "ignored",
        reason:
          sendResult.reason,
        automation_key:
          params.automationKey,
        run_id:
          params.runId,
      };
    }

    return {
      state: "failed",
      reason:
        sendResult.reason,
      automation_key:
        params.automationKey,
      run_id:
        params.runId,
    };
  }

  return {
    state: "ignored",
    reason:
      "automation_handler_missing",
    automation_key:
      params.automationKey,
    run_id:
      params.runId,
  };
}

// =======================================================
// MAIN TRIGGER
// =======================================================

export async function triggerWhatsAppShippingAutomation(
  admin: SupabaseClient,
  params: {
    storeId: number;
    shippingId: number;
    orderId: number;
    status: string;
  }
): Promise<TriggerResult> {
  try {
    const normalizedStatus =
      normalizeValue(
        params.status
      );

    // =====================================================
    // 1. RESOLVE AUTOMATION FROM CASSTOR STATUS
    // =====================================================
    //
    // Future:
    //
    // Pas de réponse
    // -> delivery_no_answer
    //
    // Annulé
    // -> delivery_cancelled
    //
    // =====================================================

    let automationKey:
      AutomationKey | null =
        null;

    if (
      normalizedStatus ===
      normalizeValue(
        "Refusé"
      )
    ) {
      automationKey =
        "refused_feedback";
    }

    if (!automationKey) {
      return {
        state: "ignored",
        reason:
          "no_automation_for_status",
      };
    }

    // =====================================================
    // 2. CHECK STORE SETTING
    // =====================================================

    if (
      automationKey ===
      "refused_feedback"
    ) {
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
          params.storeId
        )
        .maybeSingle();

      if (settingsError) {
        console.error(
          "Shipping WhatsApp settings lookup failed:",
          settingsError
        );

        return {
          state: "failed",
          reason:
            "settings_lookup_failed",
          automation_key:
            automationKey,
        };
      }

      if (
        !settings
          ?.refused_feedback_enabled
      ) {
        return {
          state: "ignored",
          reason:
            "automation_disabled",
          automation_key:
            automationKey,
        };
      }
    }

    // =====================================================
    // 3. VERIFY CURRENT SHIPMENT STATE
    // =====================================================
    //
    // Never trust only the old webhook event.
    // The shipment must STILL have the status
    // that triggered the automation.
    // =====================================================

    const {
      data: shipment,
      error: shipmentError,
    } = await admin
      .from(
        "shipping"
      )
      .select(`
        id,
        store_id,
        order_id,
        shipping_status
      `)
      .eq(
        "id",
        params.shippingId
      )
      .eq(
        "store_id",
        params.storeId
      )
      .eq(
        "order_id",
        params.orderId
      )
      .maybeSingle();

    if (
      shipmentError ||
      !shipment
    ) {
      console.error(
        "Shipping WhatsApp shipment verification failed:",
        shipmentError
      );

      return {
        state: "failed",
        reason:
          "shipment_not_found",
        automation_key:
          automationKey,
      };
    }

    if (
      normalizeValue(
        shipment.shipping_status
      ) !== normalizedStatus
    ) {
      return {
        state: "ignored",
        reason:
          "shipment_status_changed",
        automation_key:
          automationKey,
      };
    }

    // =====================================================
    // 4. TRY TO CREATE A NEW RUN
    // =====================================================
    //
    // UNIQUE (
    //   shipping_id,
    //   automation_key
    // )
    //
    // guarantees only one logical automation
    // per shipment.
    // =====================================================

    const now =
      new Date().toISOString();

    const {
      data: newRun,
      error: insertError,
    } = await admin
      .from(
        "whatsapp_shipping_automation_runs"
      )
      .insert({
        store_id:
          params.storeId,

        shipping_id:
          params.shippingId,

        order_id:
          params.orderId,

        automation_key:
          automationKey,

        trigger_status:
          params.status,

        status:
          "pending",

        attempt_count:
          0,

        last_error:
          null,

        created_at:
          now,

        updated_at:
          now,
      })
      .select(`
        id,
        status,
        attempt_count,
        last_error
      `)
      .single();

    // =====================================================
    // 5. NEW RUN CREATED
    // =====================================================

    if (
      !insertError &&
      newRun
    ) {
      return await executeAutomation(
        admin,
        {
          runId:
            String(
              newRun.id
            ),

          automationKey,
        }
      );
    }

    // =====================================================
    // 6. INSERT ERROR OTHER THAN DUPLICATE
    // =====================================================

    if (
      insertError &&
      insertError.code !==
        "23505"
    ) {
      console.error(
        "Shipping WhatsApp automation run creation failed:",
        insertError
      );

      return {
        state: "failed",
        reason:
          "run_creation_failed",
        automation_key:
          automationKey,
      };
    }

    // =====================================================
    // 7. RUN ALREADY EXISTS
    // =====================================================
    //
    // This is normal when Ozon repeats a webhook.
    // =====================================================

    const {
      data: existingRun,
      error:
        existingRunError,
    } = await admin
      .from(
        "whatsapp_shipping_automation_runs"
      )
      .select(`
        id,
        status,
        attempt_count,
        last_error,
        outgoing_message_id,
        sent_at,
        updated_at
      `)
      .eq(
        "shipping_id",
        params.shippingId
      )
      .eq(
        "automation_key",
        automationKey
      )
      .maybeSingle();

    if (
      existingRunError ||
      !existingRun
    ) {
      console.error(
        "Existing Shipping WhatsApp automation lookup failed:",
        existingRunError
      );

      return {
        state: "failed",
        reason:
          "existing_run_lookup_failed",
        automation_key:
          automationKey,
      };
    }

    const existingRunId =
      String(
        existingRun.id
      );

    const existingStatus =
      String(
        existingRun.status ||
          ""
      );

    const attemptCount =
      Number(
        existingRun.attempt_count ||
          0
      );

    const lastError =
      String(
        existingRun.last_error ||
          ""
      );

    // =====================================================
    // 8. ALREADY SENT
    // =====================================================

    if (
      existingStatus ===
        "sent" ||
      existingRun
        .outgoing_message_id ||
      existingRun.sent_at
    ) {
      return {
        state: "ignored",
        reason:
          "automation_already_sent",
        automation_key:
          automationKey,
        run_id:
          existingRunId,
      };
    }

    // =====================================================
    // 9. PENDING
    // =====================================================
    //
    // Another process may currently be sending it.
    //
    // IMPORTANT:
    // We do NOT automatically reclaim stale pending
    // runs because we prefer missing one retry over
    // risking a duplicate WhatsApp message.
    // =====================================================

    if (
      existingStatus ===
      "pending"
    ) {
      return {
        state: "ignored",
        reason:
          "automation_already_pending",
        automation_key:
          automationKey,
        run_id:
          existingRunId,
      };
    }

    // =====================================================
    // 10. CANCELLED
    // =====================================================

    if (
      existingStatus ===
      "cancelled"
    ) {
      return {
        state: "ignored",
        reason:
          "automation_cancelled",
        automation_key:
          automationKey,
        run_id:
          existingRunId,
      };
    }

    // =====================================================
    // 11. FAILED RUN
    // =====================================================

    if (
      existingStatus !==
      "failed"
    ) {
      return {
        state: "ignored",
        reason:
          "automation_not_retryable",
        automation_key:
          automationKey,
        run_id:
          existingRunId,
      };
    }

    // =====================================================
    // 12. DO NOT RETRY UNCERTAIN META SENDS
    // =====================================================
    //
    // If a network problem happened while talking
    // to Meta, we may not know whether Meta accepted
    // the message.
    //
    // Retrying automatically could send a duplicate.
    // =====================================================

    if (
      lastError.startsWith(
        "meta_send_uncertain:"
      )
    ) {
      return {
        state: "ignored",
        reason:
          "meta_send_result_uncertain",
        automation_key:
          automationKey,
        run_id:
          existingRunId,
      };
    }

    // =====================================================
    // 13. MAX RETRIES
    // =====================================================

    if (
      attemptCount >=
      MAX_ATTEMPTS
    ) {
      return {
        state: "ignored",
        reason:
          "max_attempts_reached",
        automation_key:
          automationKey,
        run_id:
          existingRunId,
      };
    }

    // =====================================================
    // 14. ACQUIRE RETRY LOCK
    // =====================================================
    //
    // Two repeated webhooks could arrive at nearly
    // the same time.
    //
    // Only ONE of them may change:
    //
    // failed -> pending
    //
    // because we filter using:
    // - id
    // - status = failed
    // - exact attempt_count
    //
    // =====================================================

    const {
      data: acquiredRun,
      error:
        acquireError,
    } = await admin
      .from(
        "whatsapp_shipping_automation_runs"
      )
      .update({
        status:
          "pending",

        last_error:
          null,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        existingRunId
      )
      .eq(
        "status",
        "failed"
      )
      .eq(
        "attempt_count",
        attemptCount
      )
      .select(
        "id"
      )
      .maybeSingle();

    if (
      acquireError
    ) {
      console.error(
        "Shipping WhatsApp retry lock failed:",
        acquireError
      );

      return {
        state: "failed",
        reason:
          "retry_lock_failed",
        automation_key:
          automationKey,
        run_id:
          existingRunId,
      };
    }

    // Another webhook already acquired the retry.
    if (!acquiredRun) {
      return {
        state: "ignored",
        reason:
          "retry_already_acquired",
        automation_key:
          automationKey,
        run_id:
          existingRunId,
      };
    }

    console.log(
      "Retrying Shipping WhatsApp automation:",
      {
        runId:
          existingRunId,

        automationKey,

        previousAttemptCount:
          attemptCount,
      }
    );

    // =====================================================
    // 15. EXECUTE RETRY
    // =====================================================

    return await executeAutomation(
      admin,
      {
        runId:
          existingRunId,

        automationKey,
      }
    );
  } catch (error) {
    console.error(
      "Unexpected Shipping WhatsApp automation trigger error:",
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