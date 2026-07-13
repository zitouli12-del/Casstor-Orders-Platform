import { NextResponse } from "next/server";

import { syncTrackingWorkflow } from "@/src/services/shipping/tracking/syncTrackingWorkflow";
import { getActiveStores } from "@/src/services/stores/getActiveStores";

export async function GET() {
  try {
    const stores = await getActiveStores();

    const results = [];

    for (const store of stores) {
      const result = await syncTrackingWorkflow(store.id);

      results.push({
        storeId: store.id,
        result,
      });
    }

    return NextResponse.json({
      success: true,
      processedStores: stores.length,
      results,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}