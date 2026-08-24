import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/src/lib/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEFAULT_MESSAGE_LIMIT = 50;
const MAX_MESSAGE_LIMIT = 100;

function getSupabaseAdmin() {
  if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
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

export async function GET(request: Request) {
  try {
    // -----------------------------------------
    // 1. Authenticated user
    // -----------------------------------------

    const supabase =
      await getServerSupabase();

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

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
    } =
      await supabase
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
    // 4. Query params
    // -----------------------------------------

    const url = new URL(request.url);

    const conversationIdParam =
      url.searchParams.get(
        "conversation_id"
      );

    const limitParam =
      Number(
        url.searchParams.get("limit")
      );

    const requestedLimit =
      Number.isFinite(limitParam) &&
      limitParam > 0
        ? Math.floor(limitParam)
        : DEFAULT_MESSAGE_LIMIT;

    const messageLimit =
      Math.min(
        requestedLimit,
        MAX_MESSAGE_LIMIT
      );

    const beforeCreatedAt =
      url.searchParams.get(
        "before_created_at"
      );

    const beforeIdParam =
      url.searchParams.get("before_id");

    const beforeId = beforeIdParam
      ? Number(beforeIdParam)
      : null;

    // -----------------------------------------
    // 5. Conversations
    // -----------------------------------------

    const {
      data: conversations,
      error: conversationsError,
    } =
      await admin
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
    // 6. Messages
    //
    // - Explicit conversation_id => load that chat only.
    // - Initial Inbox load => preload the first conversation.
    // - Never load the full history of every conversation.
    // -----------------------------------------

    let messages: any[] = [];

    const targetConversationId =
      conversationIdParam
        ? Number(
            conversationIdParam
          )
        : conversations?.[0]?.id ??
          null;

    if (
      Number.isInteger(
        targetConversationId
      )
    ) {
      const conversationId =
        targetConversationId;

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

      const conversationExists =
        (conversations || []).some(
          (conversation) =>
            conversation.id ===
            conversationId
        );

      if (!conversationExists) {
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

      let messagesQuery = admin
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
        .eq(
          "conversation_id",
          conversationId
        );

      if (beforeCreatedAt) {
        if (!beforeId || !Number.isInteger(beforeId)) {
          return NextResponse.json(
            {
              success: false,
              message: "Curseur de pagination invalide.",
            },
            { status: 400 }
          );
        }

        messagesQuery = messagesQuery.or(
          `created_at.lt.${beforeCreatedAt},and(created_at.eq.${beforeCreatedAt},id.lt.${beforeId})`
        );
      }

      const {
        data: messageData,
        error: messagesError,
      } = await messagesQuery
        .order(
          "created_at",
          { ascending: false }
        )
        .order(
          "id",
          { ascending: false }
        )
        // Fetch one extra row so the UI can know
        // whether an older page exists.
        .range(
          0,
          messageLimit
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

      const fetchedMessages =
        messageData || [];

      const hasMoreMessages =
        fetchedMessages.length >
        messageLimit;

      const pageMessages =
        hasMoreMessages
          ? fetchedMessages.slice(
              0,
              messageLimit
            )
          : fetchedMessages;

      // The UI expects oldest -> newest.
      messages =
        [...pageMessages].reverse();

      const oldestMessage =
        pageMessages.length > 0
          ? pageMessages[pageMessages.length - 1]
          : null;

      const nextCursor =
        hasMoreMessages && oldestMessage
          ? {
              created_at: oldestMessage.created_at,
              id: oldestMessage.id,
            }
          : null;

      return NextResponse.json({
        success: true,
        conversations:
          conversations || [],
        messages,
        message_limit:
          messageLimit,
        has_more_messages:
          hasMoreMessages,
        next_cursor:
          nextCursor,
        messages_loaded_for:
          targetConversationId,
      });
    }

    // -----------------------------------------
    // 7. Success
    // -----------------------------------------

    return NextResponse.json({
      success: true,
      conversations:
        conversations || [],
      messages,
      message_limit:
        messageLimit,
      has_more_messages: false,
      next_cursor: null,
      messages_loaded_for:
        targetConversationId,
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