import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  try {
    const { secret } = await params;

    // 1. البحث عن provider باستعمال webhook_secret
    const { data: provider, error: providerError } = await supabase
      .from("shipping_providers")
      .select(`
        id,
        store_id,
        provider_code,
        provider_name,
        webhook_secret,
        webhook_enabled
      `)
      .eq("webhook_secret", secret)
      .eq("webhook_enabled", true)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid webhook",
        },
        { status: 401 }
      );
    }

    // 2. قراءة البيانات القادمة من Ozon
    const body = await request.json();

    console.log("========== SHIPPING WEBHOOK ==========");
    console.log("Provider:", provider.provider_name);
    console.log("Store ID:", provider.store_id);
    console.log("Webhook body:", body);
    console.log("======================================");

    // 3. تخزين الـWebhook الخام في قاعدة البيانات
    const { data: webhookEvent, error: webhookError } = await supabase
      .from("shipping_webhook_events")
      .insert({
        provider_id: provider.id,
        store_id: provider.store_id,
        order_id: body.orderId ?? null,
        order_status: body.orderStatus ?? null,
        situation: body.situation ?? null,
        note: body.note ?? null,
        payload: body,
      })
      .select()
      .single();

    if (webhookError) {
      console.error("WEBHOOK DB ERROR:", webhookError);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to save webhook event",
        },
        { status: 500 }
      );
    }

    console.log("Webhook event saved:", webhookEvent.id);

    // 4. حالياً غير نستقبلو ونخزنو البيانات
    // مازال ما غاديش نحدثو shipping

    return NextResponse.json({
      success: true,
      webhook_event_id: webhookEvent.id,
    });
  } catch (error) {
    console.error("WEBHOOK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Webhook processing error",
      },
      { status: 500 }
    );
  }
}