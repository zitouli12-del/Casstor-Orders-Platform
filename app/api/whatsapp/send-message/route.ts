import { NextResponse } from "next/server";
import { getServerSupabase } from "@/src/lib/server";

const GRAPH_API_VERSION = "v26.0";

function normalizeMoroccanPhone(phone: string) {
  let value = phone.replace(/\D/g, "");

  if (value.startsWith("0")) {
    value = "212" + value.slice(1);
  }

  if (value.startsWith("212")) {
    return value;
  }

  return value;
}

export async function POST(request: Request) {
  console.log("🔥 NEW WHATSAPP ROUTE VERSION 2026-08-12");

  try {
    const supabase = await getServerSupabase();

    // -----------------------------------------
    // 1. Authenticated user
    // -----------------------------------------

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

    // -----------------------------------------
    // 2. Body
    // -----------------------------------------

    const body = await request.json();

    const {
      order_id,
      phone,
      message,
    } = body;

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Numéro de téléphone manquant.",
        },
        { status: 400 }
      );
    }

    if (!message || !String(message).trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Message vide.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 3. Store
    // -----------------------------------------

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

    // -----------------------------------------
    // 4. WhatsApp connection
    // -----------------------------------------

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
      !connection.phone_number_id ||
      !connection.access_token
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Phone Number ID ou Access Token manquant.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 5. Normalize client phone
    // -----------------------------------------

    const recipientPhone = normalizeMoroccanPhone(
      String(phone)
    );

    if (!recipientPhone) {
      return NextResponse.json(
        {
          success: false,
          message: "Numéro de téléphone invalide.",
        },
        { status: 400 }
      );
    }

    console.log("======================================");
    console.log("===== WHATSAPP SEND MESSAGE =====");
    console.log("Order ID:", order_id);
    console.log("Phone original:", phone);
    console.log("Phone normalized:", recipientPhone);
    console.log(
      "Phone Number ID:",
      connection.phone_number_id
    );
    console.log("WABA ID:", connection.waba_id);
    console.log("Message:", message);
    console.log("======================================");

    // -----------------------------------------
    // 6. Meta WhatsApp API
    // -----------------------------------------

    const url =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${connection.phone_number_id}/messages`;

    const metaResponse = await fetch(url, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        messaging_product: "whatsapp",

        to: recipientPhone,

        type: "text",

        text: {
          body: String(message).trim(),
        },
      }),

      cache: "no-store",
    });

    // -----------------------------------------
    // 8. Read Meta response safely
    // -----------------------------------------

    const responseText = await metaResponse.text();

    let metaData: unknown;

    try {
      metaData = JSON.parse(responseText);
    } catch {
      metaData = {
        raw_response: responseText,
      };
    }

    console.log("===== META RESPONSE =====");
    console.log(
      JSON.stringify(metaData, null, 2)
    );
    console.log(
      "HTTP STATUS:",
      metaResponse.status
    );
    console.log("=========================");

    // -----------------------------------------
    // 9. Meta error
    // -----------------------------------------

    if (!metaResponse.ok) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Meta a refusé l'envoi du message.",

          meta_status: metaResponse.status,

          meta_response: metaData,

          phone_number_id:
            connection.phone_number_id,

          recipient: recipientPhone,
        },
        {
          status: 400,
        }
      );
    }

    // -----------------------------------------
    // 10. Success
    // -----------------------------------------

    return NextResponse.json({
      success: true,

      message:
        "Message WhatsApp envoyé avec succès.",

      order_id: order_id ?? null,

      recipient: recipientPhone,

      phone_number_id:
        connection.phone_number_id,

      meta_response: metaData,
    });
  } catch (error) {
    console.error(
      "Erreur envoi WhatsApp:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Une erreur inattendue est survenue.",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}