import { processOrdersWorkflow }
from "./ozon/processOrdersWorkflow";

export async function processShippingWorkflow(
  provider: string,
  orderIds: number[]
) {

  if (provider === "ozon") {
    return processOrdersWorkflow(
      orderIds
    );
  }

  throw new Error(
    `Provider non supporté: ${provider}`
  );
}