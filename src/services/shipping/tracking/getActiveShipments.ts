import { supabase } from "@/src/lib/supabase";
import { TRACKING_BATCH_SIZE } from "../ozon/tracking/constants";
import { OZON_STATUS } from "../ozon/tracking/status";

export async function getActiveShipments(storeId: number) {
  const finalStatuses = Object.entries(OZON_STATUS)
    .filter(([, status]) => status.final)
    .map(([code]) => code);

  const { data, error } = await supabase
    .from("shipping")
    .select(`
      id,
      tracking_number,
      shipping_status,
      provider
    `)
    .eq("store_id", storeId)
    .not("shipping_status", "in", `(${finalStatuses.join(",")})`)
    .order("updated_at", { ascending: true })
    .limit(TRACKING_BATCH_SIZE);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}