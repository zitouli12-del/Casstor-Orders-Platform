import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseOzonNote } from "@/src/services/shipping/webhook/ozon/parseNote";

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

    // =========================================================
    // 1. البحث عن Provider باستعمال Webhook Secret
    // =========================================================

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

    // =========================================================
    // 2. قراءة Webhook Payload
    // =========================================================

    const body = await request.json();

    console.log("========== SHIPPING WEBHOOK ==========");
    console.log("Provider:", provider.provider_name);
    console.log("Store ID:", provider.store_id);
    console.log("Webhook body:", body);
    console.log("======================================");

    // =========================================================
    // 3. استخراج المعلومات الأساسية
    // =========================================================

    const orderId = body?.orderId;
    const orderStatus = body?.orderStatus ?? null;
    const situation = body?.situation ?? null;
    const rawNote = body?.note ?? null;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "orderId missing",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 4. تخزين الـ Webhook الخام
    // =========================================================

    const { data: webhookEvent, error: webhookInsertError } = await supabase
      .from("shipping_webhook_events")
      .insert({
        provider_id: provider.id,
        store_id: provider.store_id,
        order_id: String(orderId),
        order_status: orderStatus,
        situation,
        note: rawNote,
        payload: body,
      })
      .select("id")
      .single();

    if (webhookInsertError) {
      console.error(
        "WEBHOOK EVENT INSERT ERROR:",
        webhookInsertError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to store webhook event",
        },
        { status: 500 }
      );
    }

    // =========================================================
    // 5. البحث عن الشحنة باستعمال Tracking Number
    // =========================================================

    const { data: shipment, error: shipmentError } = await supabase
      .from("shipping")
      .select(`
        id,
        tracking_number,
        provider,
        store_id,
        shipping_status,
        shipping_situation,
        shipping_note,
        courier_name,
        courier_phone
      `)
      .eq("tracking_number", String(orderId))
      .eq("provider", provider.provider_code)
      .eq("store_id", provider.store_id)
      .maybeSingle();

    if (shipmentError) {
      console.error(
        "SHIPMENT SEARCH ERROR:",
        shipmentError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to find shipment",
        },
        { status: 500 }
      );
    }

    // =========================================================
    // 6. Tracking ما لقايناهش
    // =========================================================

    if (!shipment) {
      console.warn(
        `Shipment not found for tracking: ${orderId}`
      );

      return NextResponse.json({
        success: true,
        processed: false,
        reason: "Shipment not found",
        webhook_event_id: webhookEvent.id,
      });
    }

    // =========================================================
    // 7. تحليل Note ديال Ozon
    // =========================================================

    const parsedNote = parseOzonNote(rawNote);

    console.log("Parsed note:", parsedNote);

    // =========================================================
    // 8. بناء البيانات اللي غادي نحدثو
    // =========================================================

    const updateData: Record<string, unknown> = {
      // situation ديما كتتحدث بالقيمة الجديدة
      shipping_situation: situation,

      // وقت آخر Webhook وصل للشحنة
      last_sync_at: new Date().toISOString(),
    };

    // =========================================================
    // 9. Note خاوية
    // =========================================================

    if (parsedNote.type === "empty") {
      // ما نبدلو لا courier لا note
      console.log(
        "Webhook note is empty - keeping existing courier/note data"
      );
    }

    // =========================================================
    // 10. Note فيها Livreur + Téléphone
    // =========================================================

    else if (parsedNote.type === "courier") {
      updateData.courier_name = parsedNote.courierName;
      updateData.courier_phone = parsedNote.courierPhone;

      // المعلومات القديمة ديال note كتتمسح
      updateData.shipping_note = null;

      console.log("Courier information extracted:", {
        name: parsedNote.courierName,
        phone: parsedNote.courierPhone,
      });
    }

    // =========================================================
    // 11. Note عادية
    // =========================================================

    else if (parsedNote.type === "note") {
      updateData.shipping_note = parsedNote.note;

      // المعلومات القديمة ديال livreur كتتمسح
      updateData.courier_name = null;
      updateData.courier_phone = null;

      console.log(
        "Normal shipping note:",
        parsedNote.note
      );
    }

    // =========================================================
    // 12. تحديث Shipping
    // =========================================================

    const { error: updateError } = await supabase
      .from("shipping")
      .update(updateData)
      .eq("id", shipment.id);

    if (updateError) {
      console.error(
        "SHIPPING UPDATE ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to update shipment",
        },
        { status: 500 }
      );
    }

    // =========================================================
    // 13. تعليم Webhook بأنه تعالج بنجاح
    // =========================================================

    const { error: processedError } = await supabase
      .from("shipping_webhook_events")
      .update({
        processed_at: new Date().toISOString(),
      })
      .eq("id", webhookEvent.id);

    if (processedError) {
      console.error(
        "WEBHOOK PROCESSED UPDATE ERROR:",
        processedError
      );
    }

    // =========================================================
    // 14. النتيجة
    // =========================================================

    console.log("========== WEBHOOK PROCESSED ==========");
    console.log("Tracking:", orderId);
    console.log("Situation:", situation);
    console.log("Note type:", parsedNote.type);
    console.log("Shipment ID:", shipment.id);
    console.log("=======================================");

    return NextResponse.json({
      success: true,
      processed: true,
      webhook_event_id: webhookEvent.id,
      shipment_id: shipment.id,
      tracking_number: orderId,
      situation,
      note_type: parsedNote.type,
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