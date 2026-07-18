import { ShippingParcelInput } from "@/src/types/ShippingParcelInput";

import { resolveCity } from "./resolveCity";
import { buildParcelData } from "./buildParcelData";
import { sendParcel } from "./sendParcel";
import { saveParcel } from "./saveParcel";

export async function createShipment(
  parcel: ShippingParcelInput
) {
  const cityId = await resolveCity(
    parcel.city
  );

  const payload = buildParcelData(
    parcel,
    cityId
  );

  const response = await sendParcel(
    payload,
    parcel.storeId
  );

  const trackingNumber =
    response.trackingNumber;

  await saveParcel(
    parcel,
    trackingNumber
  );

  return {
    success: true,
    trackingNumber,
  };
}