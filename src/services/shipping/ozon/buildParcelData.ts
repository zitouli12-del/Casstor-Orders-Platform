import { Order } from "@/src/types/Order";
import { OzonParcelPayload } from "@/src/types/ozon/OzonParcel";

export function buildParcelData(
  order: Order,
  cityId: number
): OzonParcelPayload {
  const nature = [
    order.color,
    order.size,
    order.address,
  ]
    .filter(Boolean)
    .join(" - ");

  return {
    "parcel-receiver": order.name || "",
    "parcel-phone": order.phone || "",
    "parcel-city": cityId,
    "parcel-address": order.address || "",
    "parcel-note": order.livreur_comment || "",
    "parcel-price": Number(order.price || 0),
    "parcel-nature": nature,
    "parcel-stock": 0,
  };
}