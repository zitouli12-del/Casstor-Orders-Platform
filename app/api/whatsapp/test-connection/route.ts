import { NextResponse } from "next/server";
import { getServerSupabase } from "@/src/lib/server";

const GRAPH_API_VERSION = "v25.0";

export async function POST() {
  try {

    const supabase = await getServerSupabase();
    // 1. Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Utilisateur non authentifié.",
        },
        { status: 401 }
      );
    }

    // 2. Get current user's store
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        {
          success: false,
          message: "Store introuvable.",
        },
        { status: 404 }
      );
    }

    // 3. Get WhatsApp connection
    const { data: connection, error: connectionError } = await supabase
      .from("whatsapp_connections")
      .select(
        "id, store_id, phone_number, phone_number_id, waba_id, access_token"
      )
      .eq("store_id", store.id)
      .maybeSingle();

    if (connectionError) {
      console.error(
        "Erreur récupération connexion WhatsApp:",
        connectionError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Impossible de récupérer la configuration WhatsApp.",
        },
        { status: 500 }
      );
    }

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          message: "Aucune connexion WhatsApp configurée.",
        },
        { status: 404 }
      );
    }

    // 4. Validate required credentials
    if (!connection.waba_id || !connection.access_token) {
      return NextResponse.json(
        {
          success: false,
          message: "WABA ID ou Access Token manquant.",
        },
        { status: 400 }
      );
    }

    // 5. Call Meta Graph API
    const url =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${encodeURIComponent(connection.waba_id)}/phone_numbers`;

    const metaResponse = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
      },
      cache: "no-store",
    });

    const metaData = await metaResponse.json();
    console.log("===== META PHONE NUMBERS RESPONSE =====");
    console.log("WABA ID:", connection.waba_id);
    console.log("Configured Phone Number ID:", connection.phone_number_id);
    console.log("Meta Response:", JSON.stringify(metaData, null, 2));
    console.log("======================================");

    // 6. Meta returned an error
    if (!metaResponse.ok) {
      console.error("Erreur Meta WhatsApp:", metaData);

      return NextResponse.json(
        {
          success: false,
          message:
            metaData?.error?.message ||
            "Impossible de vérifier la connexion WhatsApp.",
        },
        { status: metaResponse.status }
      );
    }

    // 7. Find configured phone number
    const phoneNumbers = Array.isArray(metaData?.data)
      ? metaData.data
      : [];

    const matchedPhone = phoneNumbers.find(
      (phone: { id?: string }) =>
        phone.id === connection.phone_number_id
    );

    // 8. Phone Number ID doesn't belong to this WABA
    if (!matchedPhone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Le Phone Number ID configuré ne correspond à aucun numéro de ce WABA.",
        },
        { status: 400 }
      );
    }

    // 9. Everything is valid
    return NextResponse.json({
      success: true,
      message: "Connexion WhatsApp vérifiée avec succès.",
      phone: {
        id: matchedPhone.id,
        display_phone_number: matchedPhone.display_phone_number,
        verified_name: matchedPhone.verified_name,
        quality_rating: matchedPhone.quality_rating,
      },
    });
  } catch (error) {
    console.error("Erreur Test Connection WhatsApp:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Une erreur inattendue est survenue.",
      },
      { status: 500 }
    );
  }
}