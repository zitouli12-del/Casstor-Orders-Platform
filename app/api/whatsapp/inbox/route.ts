import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/src/lib/server";

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

export async function GET() {
  try {
    // -----------------------------------------
    // 1. Authenticated user
    // -----------------------------------------

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

    // -----------------------------------------
    // 2. Store
    // -----------------------------------------

    const {
      data: store,
      error: storeError,
    } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
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

    // -----------------------------------------
    // 3. Admin client
    // -----------------------------------------

    const admin =
      getSupabaseAdmin();

    // -----------------------------------------
    // 4. Conversations
    // -----------------------------------------

    const {
      data: conversations,
      error: conversationsError,
    } = await admin
      .from(
        "whatsapp_conversations"
      )
      .select(`
        id,
        store_id,
        order_id,
        phone,
        customer_name,
        last_message_at,
        unread_count,
        created_at,
        updated_at
      `)
      .eq(
        "store_id",
        store.id
      )
      .order(
        "last_message_at",
        {
          ascending: false,
          nullsFirst: false,
        }
      );

    if (conversationsError) {
      console.error(
        "Inbox conversations error:",
        conversationsError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Impossible de récupérer les conversations.",
        },
        {
          status: 500,
        }
      );
    }

    // -----------------------------------------
    // 5. Messages
    // -----------------------------------------

    const conversationIds =
      (conversations || []).map(
        (conversation) =>
          conversation.id
      );

    let messages: any[] = [];

    if (
      conversationIds.length > 0
    ) {
      const {
        data: messageData,
        error: messagesError,
      } = await admin
        .from(
          "whatsapp_messages"
        )
        .select(`
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
        `)
        .eq(
          "store_id",
          store.id
        )
        .in(
          "conversation_id",
          conversationIds
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        );

      if (messagesError) {
        console.error(
          "Inbox messages error:",
          messagesError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Impossible de récupérer les messages.",
          },
          {
            status: 500,
          }
        );
      }

      messages =
        messageData || [];
    }

    // -----------------------------------------
    // 6. Success
    // -----------------------------------------

    return NextResponse.json({
      success: true,
      conversations:
        conversations || [],
      messages,
    });
  } catch (error) {
    console.error(
      "WhatsApp inbox API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Une erreur inattendue est survenue.",
      },
      {
        status: 500,
      }
    );
  }
}