import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

export async function getShipmentHistory(shippingId: number) {
  const { data, error } = await supabaseAdmin
    .from("shipping_status_history")
    .select("*")
    .eq("shipping_id", shippingId)
    .order("status_date", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}