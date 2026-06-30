import { supabase } from "@/src/lib/supabase";

export async function saveParcel(
  orderId: number,
  storeId: number,
  trackingNumber: string
) {
  const { error } = await supabase
    .from("shipping")
    .insert({
      order_id: orderId,
      store_id: storeId,
      provider: "ozon",
      tracking_number: trackingNumber,
      shipping_status: "pending",
    });

  if (error) {
    throw new Error(
      `Erreur sauvegarde colis: ${error.message}`
    );
  }
}