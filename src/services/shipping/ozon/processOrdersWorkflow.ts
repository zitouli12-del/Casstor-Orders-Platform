import { supabase } from "@/src/lib/supabase";
import { getCurrentStore } from "@/src/lib/getCurrentStore";
import { processOrder } from "./processOrder";

const BATCH_SIZE = 15;

export async function processOrdersWorkflow(
  orderIds: number[]
) {
  const store = await getCurrentStore();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", store.id)
    .in("id", orderIds);

  if (error) {
    throw new Error(error.message);
  }

  if (!orders || orders.length === 0) {
    throw new Error("Aucune commande trouvée");
  }

  const results = [];

  for (let i = 0; i < orders.length; i += BATCH_SIZE) {
    const batch = orders.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (order) => {
        const result = await processOrder(order);

        if (result.success) {
          await supabase
            .from("orders")
            .update({
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);
        }

        return {
          orderId: order.id,
          ...result,
        };
      })
    );

    results.push(...batchResults);
  }

  return {
    success: true,
    total: orders.length,
    successCount: results.filter((r) => r.success).length,
    errorCount: results.filter((r) => !r.success).length,
    results,
  };
}