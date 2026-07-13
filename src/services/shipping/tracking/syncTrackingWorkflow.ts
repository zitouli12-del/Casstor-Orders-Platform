import { getProviderConfig } from "./getProviderConfig";
import { getActiveShipments } from "./getActiveShipments";
import { getBulkTracking } from "../ozon/tracking/getBulkTracking";
import { parseTrackingResponse } from "./parseTrackingResponse";
import { updateShipping } from "./updateShipping";
import { saveHistory } from "./saveHistory";
import { compareStatus } from "./compareStatus";

export async function syncTrackingWorkflow(storeId: number) {
  // 1. Provider configuration
  const config = await getProviderConfig(storeId);

  // 2. Active shipments
  const shipments = await getActiveShipments(storeId);

  if (shipments.length === 0) {
    return {
      processed: 0,
      updated: 0,
      skipped: 0,
    };
  }

  // 3. Tracking numbers
  const trackingNumbers = shipments
    .map((shipment) => shipment.tracking_number)
    .filter(Boolean);

  // 4. Ozon Tracking
  const rawResponse = await getBulkTracking({
    config,
    trackingNumbers,
  });

  // 5. Parse response
  const trackingList = parseTrackingResponse(rawResponse);

  let updatedCount = 0;
  let skippedCount = 0;

  // 6. Create lookup map
  const shipmentMap = new Map(
    shipments.map((shipment) => [
      shipment.tracking_number,
      shipment,
    ])
  );

  // 7. Compare statuses
  for (const tracking of trackingList) {
    const shipment = shipmentMap.get(tracking.trackingNumber);

    if (!shipment) {
      console.warn(
        `Shipment not found for tracking number: ${tracking.trackingNumber}`
      );
      continue;
    }

    // Status not changed
const statusChanged = compareStatus({
  currentStatus: shipment.shipping_status,
  newStatus: tracking.status,
});

if (!statusChanged) {
  skippedCount++;
  continue;
}

    // Update shipping
    await updateShipping({
      shippingId: shipment.id,
      shippingStatus: tracking.status,
      shippingSituation: tracking.situation,
      shippingNote: tracking.note,
    });

    // Save history
    await saveHistory({
      shippingId: shipment.id,
      oldStatus: shipment.shipping_status,
      newStatus: tracking.status,
      situation: tracking.situation,
      note: tracking.note,
    });

    updatedCount++;

    console.log("Shipping updated", {
      shippingId: shipment.id,
      oldStatus: shipment.shipping_status,
      newStatus: tracking.status,
    });
  }

  // 8. Return summary
  return {
    processed: trackingList.length,
    updated: updatedCount,
    skipped: skippedCount,
  };
}