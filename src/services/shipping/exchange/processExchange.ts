import { supabase } from "@/src/lib/supabase";

import { ShippingParcelInput } from "@/src/types/ShippingParcelInput";

import { createShipment } from "../ozon/createShipment";

import { ProcessExchangeInput } from "./types";

export async function processExchange(
  input: ProcessExchangeInput
) {
  const {
    data: originalShipment,
    error: shipmentError,
  } = await supabase
    .from("shipping")
    .select(`
      id,
      order_id,
      store_id,
      provider
    `)
    .eq(
      "id",
      input.originalShipmentId
    )
    .single();

  if (
    shipmentError ||
    !originalShipment
  ) {
    throw new Error(
      "Colis originale introuvable"
    );
  }

  if (
    originalShipment.provider !== "ozon"
  ) {
    throw new Error(
      `Transporteur non supporté: ${originalShipment.provider}`
    );
  }

  if (!originalShipment.store_id) {
    throw new Error(
      "Boutique du colis introuvable"
    );
  }

  const parcel: ShippingParcelInput = {
    orderId: originalShipment.order_id,

    storeId: originalShipment.store_id,

    shipmentType: "exchange",

    parentShipmentId:
      originalShipment.id,

    receiver: input.receiver,

    phone: input.phone,

    city: input.city,

    address: input.address,

    product: input.product,

    color: input.color,

    size: input.size,

    price: input.price,

    note: input.note,
  };

  return await createShipment(parcel);
}