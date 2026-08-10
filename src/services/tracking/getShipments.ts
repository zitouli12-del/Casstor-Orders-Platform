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

      courier_name,
      courier_phone,

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

  // نجيب جميع الشحنات اللي تبدل ليها الزبون
  const {
    data: clientChanges,
    error: clientChangesError,
  } = await supabase
    .from("shipment_client_changes")
    .select("shipment_id");

  if (clientChangesError) {
    throw clientChangesError;
  }

  // نحولهم إلى Set باش يكون البحث سريع
  const changedShipmentIds = new Set(
    (clientChanges ?? []).map(
      (item) => item.shipment_id
    )
  );

  // نضيف client_changed لكل Shipment
  const shipments = (data ?? []).map((shipment) => ({
    ...shipment,
    client_changed: changedShipmentIds.has(shipment.id),
  }));

  console.log("LAST SHIPMENT =", shipments[0]);

  return shipments;
}