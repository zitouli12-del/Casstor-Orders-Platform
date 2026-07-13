import { supabase } from "@/src/lib/supabase";

export async function getShipments() {
  const { data, error } = await supabase
    .from("shipping")
    .select(`
      id,
      provider,
      tracking_number,
      shipping_status,
      shipping_situation,
      shipping_note,
      client_note,
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
        notes
      )
    `)
    .order("id", { ascending: false });

  if (error) throw error;

  return data ?? [];
}