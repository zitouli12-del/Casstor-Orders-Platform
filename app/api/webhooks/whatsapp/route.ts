import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

// GET = Meta تستعمله للتحقق من الـ Webhook
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log("===== WHATSAPP WEBHOOK VERIFICATION =====");
  console.log("Mode:", mode);
  console.log("Token:", token);
  console.log("Challenge:", challenge);

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WhatsApp Webhook verified successfully");

    return new NextResponse(challenge || "", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  console.error("WhatsApp Webhook verification failed");

  return NextResponse.json(
    {
      success: false,
      message: "Invalid verify token",
    },
    { status: 403 }
  );
}

// POST = Meta غادي تبعث هنا messages/status updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("===== WHATSAPP WEBHOOK RECEIVED =====");
    console.log(JSON.stringify(body, null, 2));

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("WhatsApp Webhook error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Invalid webhook payload",
      },
      { status: 400 }
    );
  }
}