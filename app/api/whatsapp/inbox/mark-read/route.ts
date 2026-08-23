import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/src/lib/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

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

export async function POST(
  request: Request
) {
  try {
    // =====================================================
    // 1. AUTHENTICATED USER
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
    // 2. REQUEST BODY
    // =====================================================

    const body =
      await request.json();

    const conversationId =
      Number(
        body?.conversation_id
      );

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

    // =====================================================
    // 3. FIND USER STORE
    // =====================================================

    const {
      data: store,
      error: storeError,
    } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (
      storeError ||
      !store
    ) {
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

    // =====================================================
    // 4. ADMIN CLIENT
    // =====================================================

    const admin =
      getSupabaseAdmin();

    // =====================================================
    // 5. VERIFY CONVERSATION BELONGS TO STORE
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
        "id, store_id, unread_count"
      )
      .eq(
        "id",
        conversationId
      )
      .eq(
        "store_id",
        store.id
      )
      .maybeSingle();

    if (
      conversationError
    ) {
      console.error(
        "Mark read conversation lookup error:",
        conversationError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Impossible de récupérer la conversation.",
        },
        {
          status: 500,
        }
      );
    }

    if (!conversation) {
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

    // =====================================================
    // 6. MARK AS READ
    // =====================================================

    const {
      error: updateError,
    } = await admin
      .from(
        "whatsapp_conversations"
      )
      .update({
        unread_count: 0,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        conversation.id
      )
      .eq(
        "store_id",
        store.id
      );

    if (updateError) {
      console.error(
        "Mark conversation as read update error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Impossible de marquer la conversation comme lue.",
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // 7. SUCCESS
    // =====================================================

    return NextResponse.json({
      success: true,
      conversation_id:
        conversation.id,
      unread_count: 0,
    });
  } catch (error) {
    console.error(
      "Mark conversation as read error:",
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