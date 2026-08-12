import { NextResponse } from "next/server";
import { getServerSupabase } from "@/src/lib/server";

const GRAPH_API_VERSION = "v25.0";

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

    const token = connection.access_token;

    console.log("======================================");
    console.log("===== WHATSAPP ACCESS DIAGNOSTIC =====");
    console.log("Configured WABA:", connection.waba_id);
    console.log(
      "Configured Phone Number ID:",
      connection.phone_number_id
    );
    console.log("======================================");

    // --------------------------------------------------
    // 4. WABAs we want to test
    // --------------------------------------------------

    const wabas = [
      {
        name: "Configured WABA",
        id: String(connection.waba_id),
      },
      {
        name: "Casstor",
        id: "1572364464617196",
      },
      {
        name: "casstor maroc",
        id: "1002025162873956",
      },
    ];

    // Remove duplicates
    const uniqueWabas = Array.from(
      new Map(wabas.map((item) => [item.id, item])).values()
    );

    const results = [];

    // --------------------------------------------------
    // 5. Test every WABA
    // --------------------------------------------------

    for (const waba of uniqueWabas) {
      console.log(
        `===== TEST WABA: ${waba.name} (${waba.id}) =====`
      );

      // Test WABA itself
      const wabaUrl =
        `https://graph.facebook.com/${GRAPH_API_VERSION}` +
        `/${encodeURIComponent(waba.id)}` +
        `?fields=id,name`;

      const wabaResponse = await fetch(wabaUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const wabaData = await wabaResponse.json();

      console.log(
        "WABA RESPONSE:",
        JSON.stringify(wabaData, null, 2)
      );

      // Test phone numbers belonging to WABA
      const phonesUrl =
        `https://graph.facebook.com/${GRAPH_API_VERSION}` +
        `/${encodeURIComponent(waba.id)}` +
        `/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating`;

      const phonesResponse = await fetch(phonesUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const phonesData = await phonesResponse.json();

      console.log(
        "PHONE NUMBERS RESPONSE:",
        JSON.stringify(phonesData, null, 2)
      );

      const phones = Array.isArray(phonesData?.data)
        ? phonesData.data
        : [];

      const matchingPhone = phones.find(
        (phone: { id?: string }) =>
          String(phone.id) ===
          String(connection.phone_number_id)
      );

      results.push({
        waba_name: waba.name,
        waba_id: waba.id,
        waba_accessible: wabaResponse.ok,
        waba_response: wabaData,
        phone_numbers_accessible: phonesResponse.ok,
        phone_numbers: phones,
        configured_phone_found: !!matchingPhone,
      });
    }

    // --------------------------------------------------
    // 6. Final result
    // --------------------------------------------------

    const configuredResult = results.find(
      (result) =>
        result.waba_id === String(connection.waba_id)
    );

    const configuredPhoneFound =
      configuredResult?.configured_phone_found === true;

    console.log("======================================");
    console.log("FINAL DIAGNOSTIC RESULT");
    console.log(
      JSON.stringify(results, null, 2)
    );
    console.log("======================================");

    if (configuredPhoneFound) {
      return NextResponse.json({
        success: true,
        message:
          "Le WABA configuré possède bien accès au Phone Number.",
        configured_waba_id: connection.waba_id,
        configured_phone_number_id:
          connection.phone_number_id,
        results,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Le Access Token ne permet pas de retrouver le Phone Number configuré dans le WABA configuré.",
        configured_waba_id: connection.waba_id,
        configured_phone_number_id:
          connection.phone_number_id,
        results,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "Erreur diagnostic WhatsApp:",
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