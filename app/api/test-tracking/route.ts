import { NextResponse } from "next/server";
import { syncTrackingWorkflow } from "@/src/services/shipping/tracking/syncTrackingWorkflow";

export async function GET() {
  try {
    const STORE_ID = 8;

    const result = await syncTrackingWorkflow(STORE_ID);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}