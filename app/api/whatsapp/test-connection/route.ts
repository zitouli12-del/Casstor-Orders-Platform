import { NextResponse } from "next/server";
import { getServerSupabase } from "@/src/lib/server";

const GRAPH_API_VERSION = "v26.0";

export async function POST() {
  try {
    const supabase = await getServerSupabase();

    // 1. Authenticated user
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

    // 2. Store
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

    // 3. WhatsApp connection
    const { data: connection, error: connectionError } =
      await supabase
        .from("whatsapp_connections")
        .select(
          "id, store_id, phone_number, phone_number_id, waba_id, access_token"
        )
        .eq("store_id", store.id)
        .maybeSingle();

    if (connectionError) {
      console.error("Erreur récupération connexion WhatsApp:", connectionError);

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
          message: "Aucune connexion WhatsApp configurée.",
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

    const token = String(connection.access_token).trim();
    const wabaId = String(connection.waba_id).trim();
    const phoneNumberId = String(connection.phone_number_id).trim();

    console.log("======================================");
    console.log("===== WHATSAPP ACCESS DIAGNOSTIC =====");
    console.log("WABA:", wabaId);
    console.log("PHONE:", phoneNumberId);
    console.log("TOKEN LENGTH:", token.length);
    console.log("TOKEN PREFIX:", token.substring(0, 12));
    console.log("TOKEN SUFFIX:", token.substring(token.length - 8));
    console.log("======================================");

    // --------------------------------------------------
    // 4. TEST WABA
    // --------------------------------------------------

    const wabaUrl =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${encodeURIComponent(wabaId)}` +
      `?fields=id,name`;

    const wabaResponse = await fetch(wabaUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const wabaData = await wabaResponse.json();

    console.log("===== WABA RESPONSE =====");
    console.log(JSON.stringify(wabaData, null, 2));

    // --------------------------------------------------
    // 5. TEST WABA PHONE NUMBERS
    // --------------------------------------------------

    const phonesUrl =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${encodeURIComponent(wabaId)}` +
      `/phone_numbers` +
      `?fields=id,display_phone_number,verified_name,quality_rating`;

    const phonesResponse = await fetch(phonesUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const phonesData = await phonesResponse.json();

    console.log("===== WABA PHONE NUMBERS RESPONSE =====");
    console.log(JSON.stringify(phonesData, null, 2));

    // --------------------------------------------------
    // 6. TEST PHONE NUMBER DIRECTLY
    // --------------------------------------------------

    const phoneUrl =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${encodeURIComponent(phoneNumberId)}` +
      `?fields=id,display_phone_number,verified_name,quality_rating,status`;

    const phoneResponse = await fetch(phoneUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const phoneData = await phoneResponse.json();

    console.log("===== DIRECT PHONE RESPONSE =====");
    console.log(JSON.stringify(phoneData, null, 2));

    // --------------------------------------------------
    // 7. DEBUG TOKEN
    // --------------------------------------------------

    const debugUrl =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/debug_token?input_token=${encodeURIComponent(token)}`;

    const debugResponse = await fetch(debugUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const debugData = await debugResponse.json();

    console.log("===== DEBUG TOKEN RESPONSE =====");
    console.log(JSON.stringify(debugData, null, 2));

    // --------------------------------------------------
    // 8. PARSE PHONES
    // --------------------------------------------------

    const phones = Array.isArray(phonesData?.data)
      ? phonesData.data
      : [];

    const matchingPhone = phones.find(
      (phone: { id?: string }) =>
        String(phone.id) === phoneNumberId
    );

    // --------------------------------------------------
    // 9. FINAL DIAGNOSTIC
    // --------------------------------------------------

    const result = {
      configured_waba_id: wabaId,
      configured_phone_number_id: phoneNumberId,

      token: {
        length: token.length,
        prefix: token.substring(0, 12),
        suffix: token.substring(token.length - 8),
      },

      waba: {
        http_status: wabaResponse.status,
        ok: wabaResponse.ok,
        data: wabaData,
      },

      phone_numbers: {
        http_status: phonesResponse.status,
        ok: phonesResponse.ok,
        data: phonesData,
        configured_phone_found: !!matchingPhone,
      },

      direct_phone: {
        http_status: phoneResponse.status,
        ok: phoneResponse.ok,
        data: phoneData,
      },

      debug_token: {
        http_status: debugResponse.status,
        ok: debugResponse.ok,
        data: debugData,
      },
    };

    console.log("======================================");
    console.log("FINAL WHATSAPP DIAGNOSTIC");
    console.log(JSON.stringify(result, null, 2));
    console.log("======================================");

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Erreur diagnostic WhatsApp:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Une erreur inattendue est survenue.",
      },
      { status: 500 }
    );
  }
}