import { supabase } from "@/src/lib/supabase";
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

      parcel_color: parcel.color,

      parcel_size: parcel.size,

      parcel_price: parcel.price,

      shipping_status: "pending",
    });

  if (error) {
    throw new Error(
      `Erreur sauvegarde colis: ${error.message}`
    );
  }
}