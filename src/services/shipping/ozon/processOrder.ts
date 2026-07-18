import { Order } from "@/src/types/Order";
import { ShippingParcelInput } from "@/src/types/ShippingParcelInput";

import { createShipment } from "./createShipment";

export async function processOrder(
  order: Order
) {
  try {
    const parcel: ShippingParcelInput = {
      orderId: order.id,

      storeId: order.store_id,

      shipmentType: "standard",

      parentShipmentId: null,

      receiver: order.name || "",

      phone: order.phone || "",

      city: order.city || "",

      address: order.address || "",

      product: order.product,

      color: order.color,

      size: order.size,

      price: Number(order.price || 0),

      note: order.livreur_comment,
    };

    return await createShipment(parcel);

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