import { NextResponse } from "next/server";

import { importOzonCities } from "@/src/services/cities/importOzonCities";

export async function GET() {
  try {
    const result = await importOzonCities();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error(
      "IMPORT OZON CITIES ERROR =",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Erreur import villes",
      },
      {
        status: 500,
      }
    );
  }
}