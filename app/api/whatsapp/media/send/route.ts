import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/src/lib/server";

const GRAPH_API_VERSION = "v26.0";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function POST(
  request: Request
) {
  try {
    // =====================================================
    // 1. AUTH
    // =====================================================

    const supabase =
      await getServerSupabase();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Utilisateur non authentifié.",
        },
        {
          status: 401,
        }
      );
    }

    // =====================================================
    // 2. FORM DATA
    // =====================================================

    const formData =
      await request.formData();

    const conversationIdValue =
      formData.get(
        "conversation_id"
      );

    const file =
      formData.get("file");

    const captionValue =
      formData.get("caption");

    if (!conversationIdValue) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Conversation manquante.",
        },
        {
          status: 400,
        }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Image manquante.",
        },
        {
          status: 400,
        }
      );
    }

    const conversationId =
      Number(conversationIdValue);

    if (
      !Number.isInteger(
        conversationId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Conversation invalide.",
        },
        {
          status: 400,
        }
      );
    }

    const caption =
      typeof captionValue ===
      "string"
        ? captionValue.trim()
        : "";

    // =====================================================
    // 3. CHECK IMAGE TYPE
    // =====================================================

    const allowedTypes = [
      "image/jpeg",
      "image/png",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Format non supporté. Utilisez JPG ou PNG.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // 4. STORE
    // =====================================================

    const {
      data: store,
      error: storeError,
    } = await supabase
      .from("stores")
      .select("id")
      .eq(
        "owner_id",
        user.id
      )
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Store introuvable.",
        },
        {
          status: 404,
        }
      );
    }

    const storeId =
      store.id;

    // =====================================================
    // 5. ADMIN
    // =====================================================

    const admin =
      getSupabaseAdmin();

    // =====================================================
    // 6. CONVERSATION
    // =====================================================

    const {
      data: conversation,
      error:
        conversationError,
    } = await admin
      .from(
        "whatsapp_conversations"
      )
      .select(
        "id, store_id, phone, customer_name"
      )
      .eq(
        "id",
        conversationId
      )
      .eq(
        "store_id",
        storeId
      )
      .single();

    if (
      conversationError ||
      !conversation
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Conversation introuvable.",
        },
        {
          status: 404,
        }
      );
    }

    if (!conversation.phone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Numéro du client manquant.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // 7. WHATSAPP CONNECTION
    // =====================================================

    const {
      data: connection,
      error:
        connectionError,
    } = await admin
      .from(
        "whatsapp_connections"
      )
      .select(
        "phone_number_id, access_token, is_active"
      )
      .eq(
        "store_id",
        storeId
      )
      .eq(
        "is_active",
        true
      )
      .maybeSingle();

    if (connectionError) {
      console.error(
        "WhatsApp connection error:",
        connectionError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Impossible de récupérer la connexion WhatsApp.",
        },
        {
          status: 500,
        }
      );
    }

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Aucune connexion WhatsApp active.",
        },
        {
          status: 404,
        }
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
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // 8. UPLOAD IMAGE TO META
    // =====================================================

    const uploadUrl =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${connection.phone_number_id}/media`;

    const uploadForm =
      new FormData();

    uploadForm.append(
      "messaging_product",
      "whatsapp"
    );

    uploadForm.append(
      "type",
      file.type
    );

    uploadForm.append(
      "file",
      file,
      file.name
    );

    console.log(
      "===== WHATSAPP IMAGE UPLOAD ====="
    );

    console.log(
      "Conversation:",
      conversation.id
    );

    console.log(
      "Customer:",
      conversation.customer_name
    );

    console.log(
      "File:",
      file.name
    );

    console.log(
      "Type:",
      file.type
    );

    console.log(
      "Size:",
      file.size
    );

    const uploadResponse =
      await fetch(
        uploadUrl,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${connection.access_token}`,
          },

          body: uploadForm,

          cache: "no-store",
        }
      );

    const uploadText =
      await uploadResponse.text();

    let uploadData: any;

    try {
      uploadData =
        JSON.parse(
          uploadText
        );
    } catch {
      uploadData = {
        raw_response:
          uploadText,
      };
    }

    console.log(
      "===== META MEDIA UPLOAD RESPONSE ====="
    );

    console.log(
      JSON.stringify(
        uploadData,
        null,
        2
      )
    );

    if (
      !uploadResponse.ok
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Meta a refusé l'upload de l'image.",
          meta_status:
            uploadResponse.status,
          meta_response:
            uploadData,
        },
        {
          status: 400,
        }
      );
    }

    const mediaId =
      uploadData?.id;

    if (!mediaId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Meta n'a pas retourné de media ID.",
          meta_response:
            uploadData,
        },
        {
          status: 502,
        }
      );
    }

    // =====================================================
    // 9. SEND IMAGE MESSAGE
    // =====================================================

    const sendUrl =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${connection.phone_number_id}/messages`;

    const sendPayload = {
      messaging_product:
        "whatsapp",

      to:
        conversation.phone,

      type:
        "image",

      image: {
        id:
          mediaId,

        ...(caption
          ? {
              caption,
            }
          : {}),
      },
    };

    console.log(
      "===== WHATSAPP IMAGE SEND ====="
    );

    console.log(
      JSON.stringify(
        sendPayload,
        null,
        2
      )
    );

    const sendResponse =
      await fetch(
        sendUrl,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${connection.access_token}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            sendPayload
          ),

          cache: "no-store",
        }
      );

    const sendText =
      await sendResponse.text();

    let sendData: any;

    try {
      sendData =
        JSON.parse(
          sendText
        );
    } catch {
      sendData = {
        raw_response:
          sendText,
      };
    }

    console.log(
      "===== META IMAGE SEND RESPONSE ====="
    );

    console.log(
      JSON.stringify(
        sendData,
        null,
        2
      )
    );

    if (
      !sendResponse.ok
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Meta a refusé l'envoi de l'image.",

          meta_status:
            sendResponse.status,

          meta_response:
            sendData,
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // 10. WHATSAPP MESSAGE ID
    // =====================================================

    const whatsappMessageId =
      sendData?.messages?.[0]?.id ||
      null;

    // =====================================================
    // 11. SAVE OUTGOING IMAGE
    // =====================================================

    const {
      data: savedMessage,
      error:
        saveMessageError,
    } = await admin
      .from(
        "whatsapp_messages"
      )
      .insert({
        conversation_id:
          conversation.id,

        store_id:
          storeId,

        whatsapp_message_id:
          whatsappMessageId,

        direction:
          "outgoing",

        message_type:
          "image",

        body:
          caption ||
          "[Image]",

        media_id:
          mediaId,

        media_mime_type:
          file.type,

        caption:
          caption ||
          null,

        status:
          "sent",

        created_at:
          new Date().toISOString(),
      })
      .select(
        `
        id,
        conversation_id,
        whatsapp_message_id,
        direction,
        message_type,
        body,
        media_id,
        media_mime_type,
        caption,
        status,
        created_at
        `
      )
      .single();

    if (
      saveMessageError
    ) {
      console.error(
        "Outgoing image save error:",
        saveMessageError
      );

      return NextResponse.json({
        success: true,

        warning:
          "Image envoyée à WhatsApp, mais impossible de l'enregistrer dans l'historique.",

        whatsapp_message_id:
          whatsappMessageId,

        meta_response:
          sendData,
      });
    }

    // =====================================================
    // 12. UPDATE CONVERSATION
    // =====================================================

    const now =
      new Date().toISOString();

    const {
      error:
        conversationUpdateError,
    } = await admin
      .from(
        "whatsapp_conversations"
      )
      .update({
        last_message_at:
          now,

        updated_at:
          now,
      })
      .eq(
        "id",
        conversation.id
      );

    if (
      conversationUpdateError
    ) {
      console.error(
        "Conversation update error:",
        conversationUpdateError
      );
    }

    // =====================================================
    // 13. SUCCESS
    // =====================================================

    return NextResponse.json({
      success: true,

      message:
        "Image WhatsApp envoyée avec succès.",

      whatsapp_message_id:
        whatsappMessageId,

      media_id:
        mediaId,

      saved_message:
        savedMessage,

      meta_response:
        sendData,
    });
  } catch (error) {
    console.error(
      "WhatsApp image send error:",
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