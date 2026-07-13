import { getBusinessStatus } from "./getBusinessStatus";

interface Shipment {
  shipping_status: string;
}

export function getTrackingStats(shipments: Shipment[]) {
  const stats = {
    total: shipments.length,

    preparing: 0,
    inDelivery: 0,
    noAnswer: 0,
    postponed: 0,
    returned: 0,
    delivered: 0,

    unknown: 0,
  };

  for (const shipment of shipments) {
    const businessStatus = getBusinessStatus(
      shipment.shipping_status
    );

    switch (businessStatus) {
      case "preparing":
        stats.preparing++;
        break;

      case "inDelivery":
        stats.inDelivery++;
        break;

      case "noAnswer":
        stats.noAnswer++;
        break;

      case "postponed":
        stats.postponed++;
        break;

      case "returned":
        stats.returned++;
        break;

      case "delivered":
        stats.delivered++;
        break;

      default:
        stats.unknown++;
        break;
    }
  }

  return stats;
}