import { NextResponse } from "next/server";
import { getCities } from "@/src/services/cities/getCities";

export async function GET() {
  try {
    const cities = await getCities();

    return NextResponse.json(cities);

  } catch (error: any) {

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Erreur chargement villes",
      },
      {
        status: 500,
      }
    );
  }
}