import { supabase } from "@/src/lib/supabase";
import { normalizeColor } from "@/src/lib/colors";

import { ShippingParcelInput } from "@/src/types/ShippingParcelInput";

export async function saveParcel(
  parcel: ShippingParcelInput,
  trackingNumber: string
) {
  const { error } = await supabase
    .from("shipping")
    .insert({
      order_id: parcel.orderId,
      store_id: parcel.storeId,

      provider: "ozon",

      tracking_number: trackingNumber,

      shipment_type: parcel.shipmentType,

      parent_shipment_id:
        parcel.parentShipmentId,

      customer_name: parcel.receiver,

      customer_phone: parcel.phone,

      customer_city: parcel.city,

      customer_address: parcel.address,

      parcel_product: parcel.product,

      // Original value stays untouched
      parcel_color: parcel.color,

      // Stable internal color identity
      parcel_color_key:
        normalizeColor(parcel.color),

      parcel_size: parcel.size,

      parcel_price: parcel.price,

      shipping_status: "pending",
    });

  if (error) {
    throw new Error(
      `Erreur sauvegarde colis: ${error.message}`
    );
  }

  const { error: orderError } =
    await supabase
      .from("orders")
      .update({
        shipping_stage: "sent",
      })
      .eq("id", parcel.orderId);

  if (orderError) {
    throw new Error(
      `Erreur mise à jour de la commande : ${orderError.message}`
    );
  }
}