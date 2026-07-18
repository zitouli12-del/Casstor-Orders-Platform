import { supabase } from "@/src/lib/supabase";

export async function getShipments() {
  const { data, error } = await supabase
    .from("shipping")
    .select(`
      id,
      order_id,

      provider,

      tracking_number,

      shipping_status,
      shipping_situation,
      shipping_note,

      client_note,
      client_note_updated_at,

      shipment_type,
      parent_shipment_id,

      customer_name,
      customer_phone,
      customer_city,
      customer_address,

      parcel_product,
      parcel_color,
      parcel_size,
      parcel_price,

      bon_livraison_id,

      created_at,
      updated_at,

      bon_livraisons (
        id,
        delivery_note_ref
      ),

      orders (
        id,
        created_at,
        product,
        color,
        size,
        price,
        name,
        phone,
        city,
        address,
        source,
        notes
      )
    `)
    .order("id", {
      ascending: false,
    });

  if (error) {
    throw error;
  }
console.log(
  "LAST SHIPMENT =",
  data?.[0]
);

  return data ?? [];
}