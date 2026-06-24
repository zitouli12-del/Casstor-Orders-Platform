import { NextResponse } from "next/server";
import { createBonLivraisonWorkflow } from "@/src/services/bon-livraisons/createBonLivraisonWorkflow";

export async function POST(
  request: Request
) {
  try {
    const {
      selectedIds,
      provider,
    } = await request.json();

    const result =
      await createBonLivraisonWorkflow(
        selectedIds,
        provider
      );

    return NextResponse.json(result);

  } catch (error: unknown) {

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