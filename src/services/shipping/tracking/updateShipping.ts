import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

interface UpdateShippingParams {
  shippingId: number;
  shippingStatus: string;
  shippingSituation: string | null;
  shippingNote: string | null;
}

export async function updateShipping({
  shippingId,
  shippingStatus,
  shippingSituation,
  shippingNote,
}: UpdateShippingParams) {
  const { error } = await supabaseAdmin
    .from("shipping")
    .update({
      shipping_status: shippingStatus,
      shipping_situation: shippingSituation,
      shipping_note: shippingNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shippingId);

  if (error) {
    throw error;
  }
}