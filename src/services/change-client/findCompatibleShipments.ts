import { Order } from "@/src/types/Order";
import { Shipment } from "@/src/types/Shipment";

const CHANGE_CLIENT_EXCLUDED_STATUSES = [
  "Livré",
  "Retourné",
  "Remboursé",
  "Ramassé",
  "Pré ramassé",
  "Mise en distribution",
];

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function findCompatibleShipments(
  order: Order,
  shipments: Shipment[]
): Shipment[] {
  return shipments.filter((shipment) => {
    if (shipment.shipment_type !== "standard") {
      return false;
    }

    if (shipment.order_id === order.id) {
      return false;
    }

    if (
      CHANGE_CLIENT_EXCLUDED_STATUSES.includes(
        shipment.shipping_status
      )
    ) {
      return false;
    }

    return (
      normalize(shipment.parcel_product) ===
        normalize(order.product) &&
      normalize(shipment.parcel_color) ===
        normalize(order.color) &&
      normalize(shipment.parcel_size) ===
        normalize(order.size)
    );
  });
}