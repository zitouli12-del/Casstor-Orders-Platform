import { NextRequest, NextResponse } from "next/server";

import { getShipmentHistory } from "@/src/services/tracking/getShipmentHistory";

export async function GET(request: NextRequest) {
  try {
    const shippingId = Number(
      request.nextUrl.searchParams.get("shippingId")
    );

    if (!shippingId) {
      return NextResponse.json(
        {
          success: false,
          error: "shippingId is required",
        },
        { status: 400 }
      );
    }

    const history = await getShipmentHistory(shippingId);

    return NextResponse.json({
      success: true,
      history,
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