import { supabase } from "@/src/lib/supabase";
import { processOrder } from "./processOrder";

export async function processOrdersWorkflow(
  orderIds: number[]
) {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .in("id", orderIds);

  if (error) {
    throw new Error(error.message);
  }

  if (!orders || orders.length === 0) {
    throw new Error(
      "Aucune commande trouvée"
    );
  }

  const results = [];

  for (const order of orders) {

    const result =
      await processOrder(order);

    if (result.success) {
      await supabase
        .from("orders")
        .update({
          status: "hors-confirmation",
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", order.id);
    }

    results.push({
      orderId: order.id,
      ...result,
    });
  }

  return {
    success: true,
    total: orders.length,
    successCount:
      results.filter(
        (r) => r.success
      ).length,
    errorCount:
      results.filter(
        (r) => !r.success
      ).length,
    results,
  };
}