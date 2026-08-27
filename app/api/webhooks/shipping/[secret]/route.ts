import {
  after,
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";

import { parseOzonNote } from "@/src/services/shipping/webhook/ozon/parseNote";

import { triggerWhatsAppShippingAutomation } from "@/src/services/whatsapp/triggerWhatsAppShippingAutomation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Ozon Webhook status → Casstor French status
 *
 * IMPORTANT:
 * PAID / INVOICED / NOT_PAID are situations,
 * not shipment statuses, so they are intentionally
 * NOT included here.
 */
const OZON_WEBHOOK_STATUS_MAP: Record<
  string,
  string
> = {
  NEW_PARCEL: "Nouveau Colis",
  WAITING_PICKUP: "Attente De Ramassage",
  PICKED_UP: "Ramassé",
  SENT: "Expédié",
  RECEIVED: "Reçu",
  DISTRIBUTION: "Mise en distribution",
  IN_PROGRESS: "En cours",
  RETURNED: "Retourné",
  DELIVERED: "Livré",
  POSTPONED: "Reporté",
  NOANSWER: "Pas de réponse + SMS",
  OUT_OF_AREA: "Hors-zone",
  CANCELED: "Annulé",
  REFUSE: "Refusé",
  EN: "Erreur Numero",
  INT: "client intéressé",
  PROGRAMED: "Programmé",
  RPO: "reporté aujourd hui",
  SANS_ADRE: "sans adresse",
  DEPLA: "pas réponse +déplacement",
  REMBOURSED: "Remboursé",
  SENT_TO_AGENCY: "Envoyé à l'agence",
  RECEIVED_IN_AGENCY:
    "Reçu En Agence De Livraison",
  NOANSWER_DAY_2:
    "Pas de réponse J+2",
  NOANSWER_DAY_3:
    "Pas de réponse J+3",
  DEPLA_DAY_2:
    "pas réponse + déplacement J+2",
  DEPLA_DAY_3:
    "pas réponse + déplacement J+3",
  BAM_SEIZED:
    "Saisi par Barid Al-Maghrib",
  PRE_PICKED_UP:
    "Pré ramassé",
  DAMAGED:
    "Endommagé",
  VLMN:
    "Retard Livraison 48h-72h",
  SCTR:
    "Hors Secteur",
  NCVRT:
    "Zone Non-couverte",
  DECLINED:
    "Refusé",
};

function normalizeValue(
  value:
    | string
    | null
    | undefined
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      secret: string;
    }>;
  }
) {
  try {
    const {
      secret,
    } = await params;

    // --------------------------------------------------
    // 1. Find provider using webhook secret
    // --------------------------------------------------

    const {
      data: provider,
      error: providerError,
    } = await supabase
      .from(
        "shipping_providers"
      )
      .select(`
        id,
        store_id,
        provider_code,
        provider_name,
        webhook_secret,
        webhook_enabled
      `)
      .eq(
        "webhook_secret",
        secret
      )
      .eq(
        "webhook_enabled",
        true
      )
      .single();

    if (
      providerError ||
      !provider
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid webhook",
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------------------------
    // 2. Read Ozon payload
    // --------------------------------------------------

    const body =
      await request.json();

    console.log(
      "========== SHIPPING WEBHOOK =========="
    );

    console.log(
      "Provider:",
      provider.provider_name
    );

    console.log(
      "Store ID:",
      provider.store_id
    );

    console.log(
      "Webhook body:",
      body
    );

    console.log(
      "======================================"
    );

    // --------------------------------------------------
    // 3. Only process Ozon for now
    // --------------------------------------------------

    if (
      provider.provider_code !==
      "ozon"
    ) {
      return NextResponse.json({
        success: true,
        message:
          "Provider received but not processed",
      });
    }

    const orderId =
      body?.orderId;

    const orderStatus =
      body?.orderStatus;

    const situation =
      body?.situation;

    const note =
      body?.note ?? "";

    // --------------------------------------------------
    // 4. Save raw webhook event first
    // --------------------------------------------------

    const {
      data: webhookEvent,
      error: webhookError,
    } = await supabase
      .from(
        "shipping_webhook_events"
      )
      .insert({
        provider_id:
          provider.id,

        store_id:
          provider.store_id,

        order_id:
          orderId ?? null,

        order_status:
          orderStatus ?? null,

        situation:
          situation ?? null,

        note:
          note || null,

        payload:
          body,
      })
      .select(
        "id"
      )
      .single();

    if (
      webhookError
    ) {
      console.error(
        "WEBHOOK EVENT INSERT ERROR:",
        webhookError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to save webhook event",
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------
    // 5. orderId is the Ozon tracking number
    // --------------------------------------------------

    if (!orderId) {
      console.log(
        "Webhook has no orderId"
      );

      return NextResponse.json({
        success: true,
        processed: false,
        reason:
          "Missing orderId",
      });
    }

    // --------------------------------------------------
    // 6. Find shipment using tracking number + store
    // --------------------------------------------------

    const {
      data: shipment,
      error: shipmentError,
    } = await supabase
      .from(
        "shipping"
      )
      .select(`
        id,
        order_id,
        tracking_number,
        store_id,
        shipping_status,
        shipping_situation,
        courier_name,
        courier_phone,
        shipping_note
      `)
      .eq(
        "tracking_number",
        String(orderId)
      )
      .eq(
        "store_id",
        provider.store_id
      )
      .maybeSingle();

    if (
      shipmentError
    ) {
      console.error(
        "SHIPMENT SEARCH ERROR:",
        shipmentError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to find shipment",
        },
        {
          status: 500,
        }
      );
    }

    if (!shipment) {
      console.log(
        "Shipment not found:",
        orderId
      );

      return NextResponse.json({
        success: true,
        processed: false,
        reason:
          "Shipment not found",
        trackingNumber:
          orderId,
      });
    }

    // --------------------------------------------------
    // 7. Parse note
    // --------------------------------------------------

    const parsedNote =
      parseOzonNote(
        note
      );

    console.log(
      "Parsed Note:",
      parsedNote
    );

    // --------------------------------------------------
    // 8. Resolve webhook status
    // --------------------------------------------------

    const normalizedOrderStatus =
      orderStatus !==
        undefined &&
      orderStatus !==
        null
        ? String(
            orderStatus
          )
            .trim()
            .toUpperCase()
        : "";

    const mappedWebhookStatus =
      normalizedOrderStatus
        ? OZON_WEBHOOK_STATUS_MAP[
            normalizedOrderStatus
          ]
        : undefined;

    if (
      normalizedOrderStatus &&
      !mappedWebhookStatus
    ) {
      console.warn(
        "UNKNOWN OZON WEBHOOK STATUS:",
        normalizedOrderStatus
      );
    }

    // --------------------------------------------------
    // 9. Check if shipment status actually changed
    // --------------------------------------------------

    const statusChanged =
      Boolean(
        mappedWebhookStatus
      ) &&
      normalizeValue(
        shipment.shipping_status
      ) !==
        normalizeValue(
          mappedWebhookStatus
        );

    console.log(
      "STATUS CHECK:",
      {
        webhookStatus:
          normalizedOrderStatus ||
          null,

        mappedStatus:
          mappedWebhookStatus ??
          null,

        currentStatus:
          shipment.shipping_status,

        statusChanged,
      }
    );

    // --------------------------------------------------
    // 10. Prepare update
    // --------------------------------------------------

    const updateData:
      Record<
        string,
        unknown
      > = {};

    // --------------------------------------------------
    // 10.1 Update shipment status
    //
    // Webhook status is converted from
    // Ozon code to the same French format
    // used by Casstor.
    //
    // Unknown status is NEVER written
    // to shipping_status.
    // --------------------------------------------------

if (
  statusChanged &&
  mappedWebhookStatus
) {
  updateData.shipping_status =
    mappedWebhookStatus;
}

    // --------------------------------------------------
    // 10.2 Update situation only if received
    // --------------------------------------------------

    if (
      situation !==
        undefined &&
      situation !==
        null &&
      String(
        situation
      ).trim() !== ""
    ) {
      updateData.shipping_situation =
        String(
          situation
        );
    }

    // --------------------------------------------------
    // 10.3 Courier information
    // --------------------------------------------------

    if (
      parsedNote.type ===
      "courier"
    ) {
      if (
        parsedNote.courierName
      ) {
        updateData.courier_name =
          parsedNote.courierName;
      }

      if (
        parsedNote.courierPhone
      ) {
        updateData.courier_phone =
          parsedNote.courierPhone;
      }
    }

    // --------------------------------------------------
    // 10.4 Normal shipping note
    // --------------------------------------------------

    if (
      parsedNote.type ===
      "note"
    ) {
      if (
        parsedNote.note
      ) {
        updateData.shipping_note =
          parsedNote.note;
      }
    }

    // --------------------------------------------------
    // 10.5 Empty note
    //
    // Do NOT modify:
    // - courier_name
    // - courier_phone
    // - shipping_note
    // --------------------------------------------------

    // Always update last synchronization time

    updateData.last_sync_at =
      new Date().toISOString();

    // --------------------------------------------------
    // 11. Update shipping
    // --------------------------------------------------

    const {
      error: updateError,
    } = await supabase
      .from(
        "shipping"
      )
      .update(
        updateData
      )
      .eq(
        "id",
        shipment.id
      );

    if (
      updateError
    ) {
      console.error(
        "SHIPPING UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to update shipment",
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------
    // 12. Save status history
    //
    // History is created ONLY when
    // status changed.
    //
    // Situation/note/courier changes alone
    // do NOT create a fake status transition.
    // --------------------------------------------------

    let historySaved =
      false;

    if (
      statusChanged &&
      mappedWebhookStatus
    ) {
      try {
        const {
          error:
            historyError,
        } = await supabase
          .from(
            "shipping_status_history"
          )
          .insert({
            shipping_id:
              shipment.id,

            old_status:
              shipment.shipping_status,

            new_status:
              mappedWebhookStatus,

            situation:
              situation !==
                undefined &&
              situation !==
                null &&
              String(
                situation
              ).trim() !== ""
                ? String(
                    situation
                  )
                : shipment.shipping_situation,

            note:
              parsedNote.type ===
                "note" &&
              parsedNote.note
                ? parsedNote.note
                : shipment.shipping_note,
          });

        if (
          historyError
        ) {
          console.error(
            "WEBHOOK SAVE HISTORY ERROR:",
            historyError
          );
        } else {
          historySaved =
            true;
        }
      } catch (
        historyError
      ) {
        console.error(
          "WEBHOOK SAVE HISTORY ERROR:",
          historyError
        );

        // Shipment update succeeded,
        // but history saving failed.
      }
    }

    // --------------------------------------------------
    // 13. Mark webhook event as processed
    // --------------------------------------------------

    const {
      error:
        processedError,
    } = await supabase
      .from(
        "shipping_webhook_events"
      )
      .update({
        processed_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        webhookEvent.id
      );

    if (
      processedError
    ) {
      console.error(
        "WEBHOOK PROCESSED UPDATE ERROR:",
        processedError
      );
    }

    // --------------------------------------------------
    // 14. WhatsApp shipping automations
    //
    // IMPORTANT:
    //
    // We do NOT trigger WhatsApp directly from
    // the raw Ozon payload.
    //
    // The shipment has already been validated,
    // mapped and updated in Casstor.
    //
    // Only a REAL Casstor status change reaches
    // the generic WhatsApp automation trigger.
    //
    // The generic trigger decides whether:
    // - this status has an automation
    // - the automation is enabled
    // - a run already exists
    // --------------------------------------------------

if (mappedWebhookStatus) {
  after(
    async () => {
      
          try {
            const automationResult =
              await triggerWhatsAppShippingAutomation(
                supabase,
                {
                  storeId:
                    Number(
                      provider.store_id
                    ),

                  shippingId:
                    Number(
                      shipment.id
                    ),

                  orderId:
                    Number(
                      shipment.order_id
                    ),

                  status:
                    mappedWebhookStatus,
                }
              );

            console.log(
              "Shipping WhatsApp automation result:",
              automationResult
            );
          } catch (
            automationError
          ) {
            console.error(
              "Shipping WhatsApp automation error:",
              automationError
            );
          }
        }
      );
    }

    // --------------------------------------------------
    // 15. Logs
    // --------------------------------------------------

    console.log(
      "========== WEBHOOK PROCESSED =========="
    );

    console.log(
      "Shipment ID:",
      shipment.id
    );

    console.log(
      "Tracking:",
      orderId
    );

    console.log(
      "Ozon Order Status:",
      orderStatus
    );

    console.log(
      "Mapped Status:",
      mappedWebhookStatus ??
        null
    );

    console.log(
      "Current Status:",
      shipment.shipping_status
    );

    console.log(
      "Status Changed:",
      statusChanged
    );

    console.log(
      "History Saved:",
      historySaved
    );

    console.log(
      "Situation:",
      situation
    );

    console.log(
      "Parsed Note:",
      parsedNote
    );

    console.log(
      "Update Data:",
      updateData
    );

    console.log(
      "======================================="
    );

    return NextResponse.json({
      success: true,

      processed: true,

      shipmentId:
        shipment.id,

      trackingNumber:
        orderId,

      status: {
        received:
          normalizedOrderStatus ||
          null,

        mapped:
          mappedWebhookStatus ??
          null,

        changed:
          statusChanged,

        historySaved,
      },

      updated:
        updateData,
    });
  } catch (
    error
  ) {
    console.error(
      "WEBHOOK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Webhook processing error",
      },
      {
        status: 500,
      }
    );
  }
}