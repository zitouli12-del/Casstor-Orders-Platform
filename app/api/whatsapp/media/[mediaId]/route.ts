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

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      mediaId: string;
    }>;
  }
) {
  try {
    // -----------------------------------------
    // 1. Auth
    // -----------------------------------------

    const supabase =
      await getServerSupabase();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new NextResponse(
        "Unauthorized",
        { status: 401 }
      );
    }

    // -----------------------------------------
    // 2. Params
    // -----------------------------------------

    const { mediaId } = await params;

    if (!mediaId) {
      return new NextResponse(
        "Media ID missing",
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 3. Store
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
      return new NextResponse(
        "Store not found",
        { status: 404 }
      );
    }

    const admin =
      getSupabaseAdmin();

    // -----------------------------------------
    // 4. Find message + verify ownership
    // -----------------------------------------

    const {
      data: mediaMessage,
      error: mediaMessageError,
    } = await admin
      .from("whatsapp_messages")
      .select(
        "id, store_id, media_id, media_mime_type"
      )
      .eq("store_id", store.id)
      .eq("media_id", mediaId)
      .maybeSingle();

    if (mediaMessageError) {
      console.error(
        "Media message lookup error:",
        mediaMessageError
      );

      return new NextResponse(
        "Media lookup failed",
        { status: 500 }
      );
    }

    if (!mediaMessage) {
      return new NextResponse(
        "Media not found",
        { status: 404 }
      );
    }

    // -----------------------------------------
    // 5. WhatsApp connection
    // -----------------------------------------

    const {
      data: connection,
      error: connectionError,
    } = await admin
      .from("whatsapp_connections")
      .select(
        "phone_number_id, access_token, is_active"
      )
      .eq("store_id", store.id)
      .eq("is_active", true)
      .maybeSingle();

    if (connectionError) {
      console.error(
        "WhatsApp connection lookup error:",
        connectionError
      );

      return new NextResponse(
        "WhatsApp connection lookup failed",
        { status: 500 }
      );
    }

    if (!connection) {
      return new NextResponse(
        "WhatsApp connection not found",
        { status: 404 }
      );
    }

    // -----------------------------------------
    // 6. Get Meta media URL
    // -----------------------------------------

    const mediaInfoUrl =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${encodeURIComponent(mediaId)}`;

    const mediaInfoResponse =
      await fetch(mediaInfoUrl, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${connection.access_token}`,
        },

        cache: "no-store",
      });

    if (!mediaInfoResponse.ok) {
      const errorText =
        await mediaInfoResponse.text();

      console.error(
        "Meta media info error:",
        errorText
      );

      return new NextResponse(
        "Unable to retrieve WhatsApp media",
        { status: 502 }
      );
    }

    const mediaInfo =
      await mediaInfoResponse.json();

    const mediaUrl =
      mediaInfo?.url;

    if (!mediaUrl) {
      return new NextResponse(
        "Media URL not available",
        { status: 502 }
      );
    }

    // -----------------------------------------
    // 7. Download media from Meta
    // -----------------------------------------

    const mediaResponse =
      await fetch(mediaUrl, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${connection.access_token}`,
        },

        cache: "no-store",
      });

    if (!mediaResponse.ok) {
      const errorText =
        await mediaResponse.text();

      console.error(
        "Meta media download error:",
        errorText
      );

      return new NextResponse(
        "Unable to download WhatsApp media",
        { status: 502 }
      );
    }

    const contentType =
      mediaResponse.headers.get(
        "content-type"
      ) ||
      mediaMessage.media_mime_type ||
      "application/octet-stream";

    const buffer =
      await mediaResponse.arrayBuffer();

    // -----------------------------------------
    // 8. Return media
    // -----------------------------------------

    return new NextResponse(
      buffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            contentType,

          "Cache-Control":
            "private, max-age=3600",

          "Content-Length":
            String(buffer.byteLength),
        },
      }
    );
  } catch (error) {
    console.error(
      "WhatsApp media proxy error:",
      error
    );

    return new NextResponse(
      "Internal server error",
      { status: 500 }
    );
  }
}