import { NextResponse } from "next/server";
import { processShippingWorkflow } from "@/src/services/shipping/processShippingWorkflow";

export async function POST(
  req: Request
) {
  try {

    const {
      orderIds,
      provider,
    } = await req.json();

    if (
      !orderIds ||
      !Array.isArray(orderIds) ||
      orderIds.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Aucune commande sélectionnée",
        },
        {
          status: 400,
        }
      );
    }

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Aucun transporteur sélectionné",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await processShippingWorkflow(
        provider,
        orderIds
      );

    return NextResponse.json(
      result
    );

  } catch (error: unknown) {

    console.error(
      "SHIPPING API ERROR =",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}