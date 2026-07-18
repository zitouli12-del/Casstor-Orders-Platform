import { ShippingParcelInput } from "@/src/types/ShippingParcelInput";
import { OzonParcelPayload } from "@/src/types/ozon/OzonParcel";

export function buildParcelData(
  parcel: ShippingParcelInput,
  cityId: number
): OzonParcelPayload {
  const nature = [
    parcel.color,
    parcel.size,
    parcel.product,
  ]
    .filter(Boolean)
    .join(" - ");

  return {
    "parcel-receiver": parcel.receiver,
    "parcel-phone": parcel.phone,
    "parcel-city": cityId,
    "parcel-address": parcel.address,
    "parcel-note": parcel.note || "",
    "parcel-price": parcel.price,
    "parcel-nature": nature,
    "parcel-stock": 0,
    "parcel-replace":
      parcel.shipmentType === "exchange"
        ? 1
        : 0,
  };
}