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

    // 5. Test the Phone Number directly
    const phoneUrl =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${encodeURIComponent(connection.phone_number_id)}` +
      `?fields=id,display_phone_number,verified_name,quality_rating`;

    console.log("===== META PHONE DIRECT TEST =====");
    console.log("Phone Number ID:", connection.phone_number_id);
    console.log("URL:", phoneUrl);

    const phoneResponse = await fetch(phoneUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
      },
      cache: "no-store",
    });

    const phoneData = await phoneResponse.json();
    console.log(
      "Phone Direct Response:",
      JSON.stringify(phoneData, null, 2)
    );
    console.log("=================================");

    // 6. Meta returned an error
    if (!phoneResponse.ok) {
      console.error("Erreur Meta Phone Number:", phoneData);

      return NextResponse.json(
        {
          success: false,
          message:
            phoneData?.error?.message ||
            "Impossible de vérifier le Phone Number.",
          meta_error: phoneData?.error || null,
        },
        { status: phoneResponse.status }
      );
    }

    // 7. Verify returned Phone Number ID
    if (
      String(phoneData?.id) !==
      String(connection.phone_number_id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Meta a répondu, mais le Phone Number ID retourné ne correspond pas.",
          expected: String(connection.phone_number_id),
          received: String(phoneData?.id || ""),
        },
        { status: 400 }
      );
    }

    // 8. Everything is valid
    return NextResponse.json({
      success: true,
      message: "Connexion WhatsApp vérifiée avec succès.",
      phone: {
        id: phoneData.id,
        display_phone_number:
          phoneData.display_phone_number,
        verified_name:
          phoneData.verified_name,
        quality_rating:
          phoneData.quality_rating,
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