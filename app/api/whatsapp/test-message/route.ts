import { NextResponse } from "next/server";
import { getServerSupabase } from "@/src/lib/server";

const GRAPH_API_VERSION = "v26.0";

export async function POST(request: Request) {
  try {
    const { to } = await request.json();

    if (!to) {
      return NextResponse.json(
        {
          success: false,
          message: "Numéro destinataire manquant.",
        },
        { status: 400 }
      );
    }

    const supabase = await getServerSupabase();

    // 1. User connecté
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
          "phone_number_id, waba_id, access_token"
        )
        .eq("store_id", store.id)
        .maybeSingle();

    if (connectionError || !connection) {
      return NextResponse.json(
        {
          success: false,
          message: "Connexion WhatsApp introuvable.",
        },
        { status: 404 }
      );
    }

    if (
      !connection.phone_number_id ||
      !connection.access_token
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone Number ID ou Access Token manquant.",
        },
        { status: 400 }
      );
    }

    const phoneNumberId = String(
      connection.phone_number_id
    ).trim();

    const token = String(
      connection.access_token
    ).trim();

    // Nettoyage du numéro
    const recipient = String(to)
      .replace(/\s+/g, "")
      .replace(/^\+/, "");

    console.log("=================================");
    console.log("===== WHATSAPP TEST MESSAGE =====");
    console.log("Phone Number ID:", phoneNumberId);
    console.log("Recipient:", recipient);
    console.log("=================================");

    // 4. WhatsApp Cloud API
    const url =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: "hello_world",
          language: {
            code: "en_US",
          },
        },
      }),
      cache: "no-store",
    });

    const data = await response.json();

    console.log("===== WHATSAPP SEND RESPONSE =====");
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "WhatsApp a refusé l'envoi.",
          status: response.status,
          whatsapp_response: data,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message WhatsApp envoyé avec succès.",
      recipient,
      whatsapp_response: data,
    });
  } catch (error) {
    console.error(
      "Erreur test WhatsApp:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Erreur inattendue.",
      },
      { status: 500 }
    );
  }
}