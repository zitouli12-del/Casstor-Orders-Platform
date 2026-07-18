import { NextResponse } from "next/server";

import { processExchange } from "@/src/services/shipping/exchange/processExchange";

import { ProcessExchangeInput } from "@/src/services/shipping/exchange/types";

export async function POST(
  req: Request
) {
  try {
    const body =
      (await req.json()) as ProcessExchangeInput;

    if (!body.originalShipmentId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Colis originale obligatoire",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !body.receiver ||
      !body.phone ||
      !body.city ||
      !body.address ||
      !body.product
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Informations du colis incomplètes",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof body.price !== "number" ||
      body.price < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Prix du colis invalide",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await processExchange(body);

    return NextResponse.json(
      result
    );
  } catch (error: unknown) {
    console.error(
      "EXCHANGE API ERROR =",
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