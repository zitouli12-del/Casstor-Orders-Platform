import { Order } from "@/src/types/Order";
import { resolveCity } from "./resolveCity";
import { buildParcelData } from "./buildParcelData";
import { sendParcel } from "./sendParcel";
import { saveParcel } from "./saveParcel";

export async function processOrder(
  order: Order
) {
  try {
    const cityId = await resolveCity(
      order.city || ""
    );

    const payload = buildParcelData(
      order,
      cityId
    );

    const response = await sendParcel(
      payload
    );

    const trackingNumber =
      response.trackingNumber;

    await saveParcel(
      order.id,
      trackingNumber
    );

    return {
      success: true,
      trackingNumber,
    };

  } catch (error: unknown) {

    console.error(
      "PROCESS ORDER ERROR =",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";

    return {
      success: false,
      error: message,
    };
  }
}