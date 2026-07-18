import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { TRACKING_BATCH_SIZE } from "../ozon/tracking/constants";

const FINAL_SHIPPING_STATUSES = [
  "Livré",
];

interface GetActiveShipmentsParams {
  storeId: number;
  afterId?: number;
}

export async function getActiveShipments({
  storeId,
  afterId = 0,
}: GetActiveShipmentsParams) {
  console.log("GET ACTIVE SHIPMENTS =", {
    storeId,
    afterId,
    batchSize: TRACKING_BATCH_SIZE,
  });

  let query = supabaseAdmin
    .from("shipping")
    .select(`
      id,
      tracking_number,
      shipping_status,
      shipping_situation,
      shipping_note,
      provider
    `)
    .eq("store_id", storeId)
    .eq("provider", "ozon")
    .not("tracking_number", "is", null)
    .not(
      "shipping_status",
      "in",
      `(${FINAL_SHIPPING_STATUSES.map(
        (status) => `"${status}"`
      ).join(",")})`
    )
    .order("id", {
      ascending: true,
    })
    .limit(TRACKING_BATCH_SIZE);

  if (afterId > 0) {
    query = query.gt("id", afterId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      "GET ACTIVE SHIPMENTS ERROR =",
      {
        storeId,
        afterId,
        message: error.message,
        error,
      }
    );

    throw new Error(
      `Impossible de charger les expéditions: ${error.message}`
    );
  }

  console.log("ACTIVE SHIPMENTS LOADED =", {
    afterId,
    count: data?.length ?? 0,
    firstId: data?.[0]?.id ?? null,
    lastId:
      data && data.length > 0
        ? data[data.length - 1].id
        : null,
  });

  return data ?? [];
}