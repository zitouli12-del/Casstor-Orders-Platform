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

    // 1. Find provider using webhook secret
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

    // 2. Read Ozon payload
    const body = await request.json();

    console.log("========== SHIPPING WEBHOOK ==========");
    console.log("Provider:", provider.provider_name);
    console.log("Store ID:", provider.store_id);
    console.log("Webhook body:", body);
    console.log("======================================");

    // 3. Only process Ozon for now
    if (provider.provider_code !== "ozon") {
      return NextResponse.json({
        success: true,
        message: "Provider received but not processed",
      });
    }

    const orderId = body?.orderId;
    const orderStatus = body?.orderStatus;
    const situation = body?.situation;
    const note = body?.note ?? "";

    // 4. Save raw webhook event first
    const { data: webhookEvent, error: webhookError } = await supabase
      .from("shipping_webhook_events")
      .insert({
        provider_id: provider.id,
        store_id: provider.store_id,
        order_id: orderId ?? null,
        order_status: orderStatus ?? null,
        situation: situation ?? null,
        note: note || null,
        payload: body,
      })
      .select("id")
      .single();

    if (webhookError) {
      console.error(
        "WEBHOOK EVENT INSERT ERROR:",
        webhookError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to save webhook event",
        },
        { status: 500 }
      );
    }

    // 5. orderId is the Ozon tracking number
    if (!orderId) {
      console.log("Webhook has no orderId");

      return NextResponse.json({
        success: true,
        processed: false,
        reason: "Missing orderId",
      });
    }

    // 6. Find shipment using tracking number + store
    const { data: shipment, error: shipmentError } =
      await supabase
        .from("shipping")
        .select(`
          id,
          tracking_number,
          store_id,
          shipping_status,
          shipping_situation,
          courier_name,
          courier_phone,
          shipping_note
        `)
        .eq("tracking_number", String(orderId))
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

    if (!shipment) {
      console.log(
        "Shipment not found:",
        orderId
      );

      return NextResponse.json({
        success: true,
        processed: false,
        reason: "Shipment not found",
        trackingNumber: orderId,
      });
    }

    // 7. Parse note
    const parsedNote = parseOzonNote(note);

    console.log("Parsed note:", parsedNote);

    // 8. Prepare update
    // IMPORTANT:
    // Each webhook only updates the information
    // that is actually present in that webhook.
    // We NEVER clear old information just because
    // the new webhook does not contain it.
    const updateData: Record<string, unknown> = {};

    // --------------------------------------------------
    // 8.1 Update order status only if received
    // --------------------------------------------------
    if (
      orderStatus !== undefined &&
      orderStatus !== null &&
      String(orderStatus).trim() !== ""
    ) {
      updateData.shipping_status = String(orderStatus);
    }

    // --------------------------------------------------
    // 8.2 Update situation only if received
    // --------------------------------------------------
    if (
      situation !== undefined &&
      situation !== null &&
      String(situation).trim() !== ""
    ) {
      updateData.shipping_situation = String(situation);
    }

    // --------------------------------------------------
    // 8.3 Courier information
    // --------------------------------------------------
    // If the webhook contains a courier:
    // update courier_name + courier_phone.
    //
    // IMPORTANT:
    // We DO NOT touch shipping_note here.
    // An old normal note must remain.
    // --------------------------------------------------
    if (parsedNote.type === "courier") {
      if (parsedNote.courierName) {
        updateData.courier_name =
          parsedNote.courierName;
      }

      if (parsedNote.courierPhone) {
        updateData.courier_phone =
          parsedNote.courierPhone;
      }
    }

    // --------------------------------------------------
    // 8.4 Normal shipping note
    // --------------------------------------------------
    // If the webhook contains a normal note:
    // update ONLY shipping_note.
    //
    // IMPORTANT:
    // We DO NOT clear courier_name or courier_phone.
    // --------------------------------------------------
    if (parsedNote.type === "note") {
      if (parsedNote.note) {
        updateData.shipping_note =
          parsedNote.note;
      }
    }

    // --------------------------------------------------
    // 8.5 Empty note
    // --------------------------------------------------
    // If note is empty:
    // do NOT modify:
    // - courier_name
    // - courier_phone
    // - shipping_note
    //
    // Their previous values stay untouched.
    // --------------------------------------------------

    // Always update last synchronization time
    updateData.last_sync_at =
      new Date().toISOString();

    // --------------------------------------------------
    // 9. Update shipping
    // --------------------------------------------------
    const { error: updateError } =
      await supabase
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

    // --------------------------------------------------
    // 10. Mark webhook event as processed
    // --------------------------------------------------
    const { error: processedError } =
      await supabase
        .from("shipping_webhook_events")
        .update({
          processed_at:
            new Date().toISOString(),
        })
        .eq("id", webhookEvent.id);

    if (processedError) {
      console.error(
        "WEBHOOK PROCESSED UPDATE ERROR:",
        processedError
      );
    }

    console.log(
      "========== WEBHOOK PROCESSED =========="
    );

    console.log("Shipment ID:", shipment.id);
    console.log("Tracking:", orderId);
    console.log("Order Status:", orderStatus);
    console.log("Situation:", situation);
    console.log("Parsed Note:", parsedNote);
    console.log("Update Data:", updateData);

    console.log(
      "======================================="
    );

    return NextResponse.json({
      success: true,
      processed: true,
      shipmentId: shipment.id,
      trackingNumber: orderId,
      updated: updateData,
    });
  } catch (error) {
    console.error(
      "WEBHOOK ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Webhook processing error",
      },
      { status: 500 }
    );
  }
}