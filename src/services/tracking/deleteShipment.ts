import { supabase } from "@/src/lib/supabase";

export async function deleteShipment(
  shipmentId: number
) {
  const { error } = await supabase
    .from("shipping")
    .delete()
    .eq("id", shipmentId);

  if (error) {
    throw new Error(
      `Impossible de supprimer l'expédition : ${error.message}`
    );
  }
}