import { normalizePhone } from "@/src/utils/normalizePhone";

interface ClientShippingHistory {
  shippedCount: number;
  deliveredCount: number;
  refusedCount: number;
  returnedCount: number;
}

function normalizeShippingStatus(status: unknown) {
  return String(status ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function analyzeClientShippingHistory(
  phone: string | null | undefined,
  shipments: any[] = []
): ClientShippingHistory {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    return {
      shippedCount: 0,
      deliveredCount: 0,
      refusedCount: 0,
      returnedCount: 0,
    };
  }

  const safeShipments = Array.isArray(shipments)
    ? shipments
    : [];

  const clientShipments = safeShipments.filter(
    (shipment) => {
      const shipmentPhone = normalizePhone(
        shipment?.orders?.phone
      );

      return shipmentPhone === normalizedPhone;
    }
  );

  let deliveredCount = 0;
  let refusedCount = 0;
  let returnedCount = 0;

  clientShipments.forEach((shipment) => {
    const status = normalizeShippingStatus(
      shipment?.shipping_status
    );

    if (status === "livre") {
      deliveredCount += 1;
      return;
    }

    if (status === "refuse") {
      refusedCount += 1;
      return;
    }

    if (status === "retourne") {
      returnedCount += 1;
    }
  });

  return {
    shippedCount: clientShipments.length,
    deliveredCount,
    refusedCount,
    returnedCount,
  };
}