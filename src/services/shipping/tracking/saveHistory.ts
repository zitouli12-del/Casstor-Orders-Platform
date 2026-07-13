import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

interface SaveHistoryParams {
  shippingId: number;
  oldStatus: string;
  newStatus: string;
  situation: string | null;
  note: string | null;
}

export async function saveHistory({
  shippingId,
  oldStatus,
  newStatus,
  situation,
  note,
}: SaveHistoryParams) {
  const { error } = await supabaseAdmin
    .from("shipping_status_history")
    .insert({
      shipping_id: shippingId,
      old_status: oldStatus,
      new_status: newStatus,
      situation,
      note,
    });

  if (error) {
    throw new Error(
      `Failed to save tracking history: ${error.message}`
    );
  }
}