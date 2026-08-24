import { NextResponse } from "next/server";
import { getServerSupabase } from "@/src/lib/server";

const GRAPH_API_VERSION = "v26.0";

export async function POST() {
  try {
    // =========================================
    // 1. AUTHENTICATED USER
    // =========================================
    const supabase = await getServerSupabase();

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

    // =========================================
    // 2. STORE
    // =========================================
    const { data: store, error: storeError } =
      await supabase
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

    // =========================================
    // 3. ACTIVE WHATSAPP CONNECTION
    // =========================================
    const {
      data: connection,
      error: connectionError,
    } = await supabase
      .from("whatsapp_connections")
      .select(
        "id, store_id, phone_number, phone_number_id, waba_id, access_token, is_active"
      )
      .eq("store_id", store.id)
      .eq("is_active", true)
      .maybeSingle();

    if (connectionError) {
      console.error(
        "Erreur récupération connexion WhatsApp:",
        connectionError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Impossible de récupérer la configuration WhatsApp.",
        },
        { status: 500 }
      );
    }

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          message: "Aucune connexion WhatsApp active.",
        },
        { status: 404 }
      );
    }

    if (
      !connection.waba_id ||
      !connection.phone_number_id ||
      !connection.access_token
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "WABA ID, Phone Number ID ou Access Token manquant.",
        },
        { status: 400 }
      );
    }

    const wabaId = String(connection.waba_id).trim();
    const phoneNumberId = String(
      connection.phone_number_id
    ).trim();

    const accessToken = String(
      connection.access_token
    ).trim();

    // =========================================
    // 4. TEST WABA
    // =========================================
    const wabaUrl =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${encodeURIComponent(wabaId)}` +
      `?fields=id,name`;

    const wabaResponse = await fetch(wabaUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    let wabaData: any = null;

    try {
      wabaData = await wabaResponse.json();
    } catch {
      wabaData = null;
    }

    if (!wabaResponse.ok) {
      console.error(
        "WhatsApp WABA test failed:",
        wabaResponse.status,
        wabaData
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "La connexion WhatsApp n'est pas valide.",
        },
        { status: 400 }
      );
    }

    // =========================================
    // 5. TEST PHONE NUMBER
    // =========================================
    const phoneUrl =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${encodeURIComponent(phoneNumberId)}` +
      `?fields=id,display_phone_number,verified_name,status`;

    const phoneResponse = await fetch(phoneUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    let phoneData: any = null;

    try {
      phoneData = await phoneResponse.json();
    } catch {
      phoneData = null;
    }

    if (!phoneResponse.ok) {
      console.error(
        "WhatsApp phone number test failed:",
        phoneResponse.status,
        phoneData
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Le numéro WhatsApp configuré n'est pas valide.",
        },
        { status: 400 }
      );
    }

    // =========================================
    // 6. SUCCESS
    // =========================================
    return NextResponse.json({
      success: true,
      message:
        "Connexion WhatsApp vérifiée avec succès.",
    });
  } catch (error) {
    console.error(
      "Erreur Test Connection WhatsApp:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Une erreur inattendue est survenue.",
      },
      { status: 500 }
    );
  }
}