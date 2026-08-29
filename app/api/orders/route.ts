import {
  after,
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";

import {
  prepareWhatsAppStockAlternativeRequest,
} from "../../../src/services/whatsapp/prepareWhatsAppStockAlternativeRequest";

import { normalizeColor } from "../../../src/lib/colors";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods":
    "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, x-api-key",
};

// =====================================================
// OPTIONS
// =====================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// =====================================================
// GET
// =====================================================

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "Orders API is working",
    },
    {
      headers: corsHeaders,
    }
  );
}

// =====================================================
// POST
// =====================================================

export async function POST(
  request: NextRequest
) {
  try {
    // =================================================
    // 1. API KEY
    // =================================================

    const apiKey =
      request.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "API key missing",
        },
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    // =================================================
    // 2. FIND STORE
    // =================================================

    const {
      data: keyData,
      error: keyError,
    } = await supabase
      .from("api_keys")
      .select(
        "store_id, is_active"
      )
      .eq(
        "api_key",
        apiKey
      )
      .single();

    if (
      keyError ||
      !keyData ||
      !keyData.is_active
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid API key",
        },
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    // =================================================
    // 3. REQUEST BODY
    // =================================================

    const body =
      await request.json();

    const {
      product,
      name,
      phone,
      city,
      address,
      color,
      size,
      price,
      source,
    } = body;

    // =================================================
    // 4. NORMALIZE COLOR KEY
    //
    // Keep the original color exactly as received.
    // Unknown colors are accepted with color_key = null.
    // =================================================

    const colorKey =
      typeof color === "string"
        ? normalizeColor(color)
        : null;

    // =================================================
    // 5. CREATE ORDER
    // =================================================

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from("orders")
      .insert({
        store_id:
          keyData.store_id,

        product,
        name,
        phone,
        city,
        address,
        color,
        color_key:
          colorKey,
        size,
        price,

        status:
          "nouvelle",

        source,
      })
      .select()
      .single();

    if (
      orderError ||
      !order
    ) {
      console.error(
        "Order creation failed:",
        orderError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            orderError?.message ||
            "Order creation failed",
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    console.log(
      "===== ORDER CREATED ====="
    );

    console.log({
      order_id:
        order.id,

      store_id:
        keyData.store_id,

      product:
        order.product,

      color:
        order.color,

      color_key:
        order.color_key,

      size:
        order.size,
    });

    // =================================================
    // 6. BACKGROUND TASKS
    //
    // IMPORTANT:
    // The Landing Page does NOT wait for WhatsApp.
    // Order success is returned immediately.
    // =================================================

    after(async () => {
      // -----------------------------------------------
      // WhatsApp Stock Alternatives
      // -----------------------------------------------

      try {
        const automationResult =
          await prepareWhatsAppStockAlternativeRequest(
            supabase,
            {
              id:
                Number(order.id),

              store_id:
                Number(
                  keyData.store_id
                ),

              product:
                order.product,

              color:
                order.color,

              size:
                order.size,
            }
          );

        console.log(
          "===== WHATSAPP STOCK ALTERNATIVES RESULT ====="
        );

        console.log({
          order_id:
            order.id,

          result:
            automationResult,
        });

        if (
          automationResult.state ===
          "failed"
        ) {
          console.error(
            "WhatsApp Stock Alternatives failed:",
            automationResult.reason
          );
        }
      } catch (
        automationError
      ) {
        console.error(
          "WhatsApp Stock Alternatives unexpected error:",
          automationError
        );
      }

      // -----------------------------------------------
      // API KEY LAST USED
      // -----------------------------------------------

      try {
        const {
          error:
            apiKeyUpdateError,
        } = await supabase
          .from("api_keys")
          .update({
            last_used_at:
              new Date().toISOString(),
          })
          .eq(
            "api_key",
            apiKey
          );

        if (
          apiKeyUpdateError
        ) {
          console.error(
            "API key last_used_at update failed:",
            apiKeyUpdateError
          );
        }
      } catch (
        apiKeyUpdateException
      ) {
        console.error(
          "API key update unexpected error:",
          apiKeyUpdateException
        );
      }
    });

    // =================================================
    // 7. RETURN SUCCESS IMMEDIATELY
    // =================================================

    return NextResponse.json(
      {
        success: true,

        order_id:
          order.id,

        store_id:
          keyData.store_id,

        stock_alternatives:
          "scheduled",
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error(
      "Orders API unexpected error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}