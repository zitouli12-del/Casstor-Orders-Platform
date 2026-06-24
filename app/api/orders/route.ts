import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Orders API is working",
  });
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key missing" },
        { status: 401 }
      );
    }

    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("store_id, is_active")
      .eq("api_key", apiKey)
      .single();

    if (keyError || !keyData || !keyData.is_active) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      product,
      name,
      phone,
      city,
      address,
      color,
      size,
      price,
    } = body;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id: keyData.store_id,
        product,
        name,
        phone,
        city,
        address,
        color,
        size,
        price,
        status: "nouvelle",
        source: "api",
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

    await supabase
      .from("api_keys")
      .update({
        last_used_at: new Date().toISOString(),
      })
      .eq("api_key", apiKey);

    return NextResponse.json({
      success: true,
      order_id: order.id,
      store_id: keyData.store_id,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}