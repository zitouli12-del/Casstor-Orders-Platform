import { getProviderConfig } from "./getProviderConfig";
import { getActiveShipments } from "./getActiveShipments";
import { getBulkTracking } from "../ozon/tracking/getBulkTracking";
import { parseTrackingResponse } from "./parseTrackingResponse";
import { updateShipping } from "./updateShipping";
import { saveHistory } from "./saveHistory";
import { compareStatus } from "./compareStatus";

import { TRACKING_BATCH_SIZE } from "../ozon/tracking/constants";

interface SyncError {
  batch: number;
  shippingId?: number;
  trackingNumber?: string;
  step: string;
  message: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    return String(
      (error as { message: unknown }).message
    );
  }

  return String(error);
}

export async function syncTrackingWorkflow(storeId: number) {
  console.log(
    "========== TRACKING SYNC START =========="
  );

  let config;

  try {
    config = await getProviderConfig(storeId);
  } catch (error) {
    const message = getErrorMessage(error);

    console.error("TRACKING SYNC CONFIG ERROR =", {
      storeId,
      step: "provider_config",
      message,
      error,
    });

    throw new Error(
      `Impossible de charger la configuration du transporteur: ${message}`
    );
  }

  let afterId = 0;
  let batchNumber = 1;
  let completedBatches = 0;

  let totalShipments = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalNotFound = 0;

  const errors: SyncError[] = [];

  while (true) {
    console.log(
      `========== BATCH ${batchNumber} START ==========`
    );

    let shipments;

    try {
      shipments = await getActiveShipments({
        storeId,
        afterId,
      });
    } catch (error) {
      const message = getErrorMessage(error);

      console.error(
        "GET ACTIVE SHIPMENTS FAILED =",
        {
          batch: batchNumber,
          afterId,
          step: "load_shipments",
          message,
          error,
        }
      );

      throw new Error(
        `Échec du chargement des expéditions au batch ${batchNumber}: ${message}`
      );
    }

    if (shipments.length === 0) {
      console.log(
        `BATCH ${batchNumber} EMPTY - SYNC FINISHED`
      );

      break;
    }

    completedBatches++;
    totalShipments += shipments.length;

    const lastShipment =
      shipments[shipments.length - 1];

    const nextAfterId = lastShipment.id;

    console.log("BATCH LOADED =", {
      batch: batchNumber,
      afterId,
      shipments: shipments.length,
      firstId: shipments[0]?.id ?? null,
      lastId: nextAfterId,
    });

    const trackingNumbers = shipments
      .map((shipment) => shipment.tracking_number)
      .filter(
        (trackingNumber): trackingNumber is string =>
          typeof trackingNumber === "string" &&
          trackingNumber.trim().length > 0
      );

    console.log("TRACKING NUMBERS PREPARED =", {
      batch: batchNumber,
      shipments: shipments.length,
      trackingNumbers: trackingNumbers.length,
    });

    if (trackingNumbers.length === 0) {
      console.warn(
        "NO VALID TRACKING NUMBERS IN BATCH =",
        {
          batch: batchNumber,
          afterId,
          firstId: shipments[0]?.id ?? null,
          lastId: nextAfterId,
        }
      );

      totalSkipped += shipments.length;

      afterId = nextAfterId;
      batchNumber++;

      continue;
    }

    let rawResponse: string;

    try {
      rawResponse = await getBulkTracking({
        config,
        trackingNumbers,
      });
    } catch (error) {
      const message = getErrorMessage(error);

      console.error(
        "OZON TRACKING API FAILED =",
        {
          batch: batchNumber,
          afterId,
          trackingCount: trackingNumbers.length,
          step: "ozon_api",
          message,
          error,
        }
      );

      throw new Error(
        `Échec Ozon Tracking API au batch ${batchNumber} (${trackingNumbers.length} colis): ${message}`
      );
    }

    let trackingList;

    try {
      trackingList =
        parseTrackingResponse(rawResponse);
    } catch (error) {
      const message = getErrorMessage(error);

      console.error(
        "PARSE TRACKING RESPONSE FAILED =",
        {
          batch: batchNumber,
          step: "parse_response",
          message,
          responsePreview:
            rawResponse.slice(0, 500),
          error,
        }
      );

      throw new Error(
        `Réponse Ozon invalide au batch ${batchNumber}: ${message}`
      );
    }

    console.log("OZON TRACKING RESULTS =", {
      batch: batchNumber,
      requested: trackingNumbers.length,
      received: trackingList.length,
    });

    const shipmentMap = new Map(
      shipments.map((shipment) => [
        String(shipment.tracking_number)
          .trim()
          .toUpperCase(),
        shipment,
      ])
    );

    let batchProcessed = 0;
    let batchUpdated = 0;
    let batchSkipped = 0;
    let batchNotFound = 0;
    let batchErrors = 0;

    for (const tracking of trackingList) {
      batchProcessed++;

      const normalizedTrackingNumber =
        String(tracking.trackingNumber)
          .trim()
          .toUpperCase();

      const shipment = shipmentMap.get(
        normalizedTrackingNumber
      );

      if (!shipment) {
        batchNotFound++;
        totalNotFound++;

        console.warn(
          "SHIPMENT NOT FOUND FOR OZON TRACKING =",
          {
            batch: batchNumber,
            trackingNumber:
              normalizedTrackingNumber,
          }
        );

        continue;
      }

      try {
        const trackingChanged = compareStatus({
          currentStatus:
            shipment.shipping_status,
          newStatus:
            tracking.status,

          currentSituation:
            shipment.shipping_situation,
          newSituation:
            tracking.situation,

          currentNote:
            shipment.shipping_note,
          newNote:
            tracking.note,
        });

        if (!trackingChanged) {
          batchSkipped++;

          continue;
        }

        console.log(
          "TRACKING CHANGE DETECTED =",
          {
            batch: batchNumber,
            shippingId: shipment.id,
            trackingNumber:
              normalizedTrackingNumber,

            oldStatus:
              shipment.shipping_status,
            newStatus:
              tracking.status,

            oldSituation:
              shipment.shipping_situation,
            newSituation:
              tracking.situation,

            oldNote:
              shipment.shipping_note,
            newNote:
              tracking.note,
          }
        );

        await updateShipping({
          shippingId: shipment.id,
          shippingStatus: tracking.status,
          shippingSituation:
            tracking.situation,
          shippingNote: tracking.note,
        });

        try {
          await saveHistory({
            shippingId: shipment.id,
            oldStatus:
              shipment.shipping_status,
            newStatus:
              tracking.status,
            situation:
              tracking.situation,
            note:
              tracking.note,
          });
        } catch (historyError) {
          const message =
            getErrorMessage(historyError);

          batchErrors++;

          errors.push({
            batch: batchNumber,
            shippingId: shipment.id,
            trackingNumber:
              normalizedTrackingNumber,
            step: "save_history",
            message,
          });

          console.error(
            "SAVE HISTORY FAILED =",
            {
              batch: batchNumber,
              shippingId: shipment.id,
              trackingNumber:
                normalizedTrackingNumber,
              message,
              error: historyError,
            }
          );
        }

        batchUpdated++;

        console.log(
          "SHIPPING TRACKING UPDATED =",
          {
            batch: batchNumber,
            shippingId: shipment.id,
            trackingNumber:
              normalizedTrackingNumber,

            oldStatus:
              shipment.shipping_status,
            newStatus:
              tracking.status,

            oldSituation:
              shipment.shipping_situation,
            newSituation:
              tracking.situation,

            oldNote:
              shipment.shipping_note,
            newNote:
              tracking.note,
          }
        );
      } catch (error) {
        const message = getErrorMessage(error);

        batchErrors++;

        errors.push({
          batch: batchNumber,
          shippingId: shipment.id,
          trackingNumber:
            normalizedTrackingNumber,
          step: "update_shipping",
          message,
        });

        console.error(
          "SHIPMENT SYNC FAILED =",
          {
            batch: batchNumber,
            shippingId: shipment.id,
            trackingNumber:
              normalizedTrackingNumber,
            currentStatus:
              shipment.shipping_status,
            currentSituation:
              shipment.shipping_situation,
            currentNote:
              shipment.shipping_note,
            ozonStatus:
              tracking.status,
            ozonSituation:
              tracking.situation,
            ozonNote:
              tracking.note,
            step: "update_shipping",
            message,
            error,
          }
        );

        continue;
      }
    }

    totalProcessed += batchProcessed;
    totalUpdated += batchUpdated;
    totalSkipped += batchSkipped;

    console.log(
      `========== BATCH ${batchNumber} SUMMARY ==========`
    );

    console.log({
      batch: batchNumber,
      shipments: shipments.length,
      requested: trackingNumbers.length,
      processed: batchProcessed,
      updated: batchUpdated,
      skipped: batchSkipped,
      notFound: batchNotFound,
      errors: batchErrors,
      firstId: shipments[0]?.id ?? null,
      lastId: nextAfterId,
    });

    console.log(
      `========== BATCH ${batchNumber} END ==========`
    );

    afterId = nextAfterId;

    if (shipments.length < TRACKING_BATCH_SIZE) {
      console.log(
        "LAST BATCH DETECTED - SYNC FINISHED"
      );

      break;
    }

    batchNumber++;
  }

  const result = {
    success: errors.length === 0,
    shipments: totalShipments,
    processed: totalProcessed,
    updated: totalUpdated,
    skipped: totalSkipped,
    notFound: totalNotFound,
    failed: errors.length,
    batches: completedBatches,
    errors,
  };

  console.log(
    "========== TRACKING SYNC FINAL SUMMARY =========="
  );

  console.log({
    success: result.success,
    shipments: result.shipments,
    processed: result.processed,
    updated: result.updated,
    skipped: result.skipped,
    notFound: result.notFound,
    failed: result.failed,
    batches: result.batches,
  });

  if (errors.length > 0) {
    console.error(
      "TRACKING SYNC ERRORS =",
      errors
    );
  }

  console.log(
    "========== TRACKING SYNC END =========="
  );

  return result;
}