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

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

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
      client_order_id,
    } = body;

    const clientOrderId =
      typeof client_order_id === "string"
        ? client_order_id.trim()
        : null;

    if (
      client_order_id !== undefined &&
      client_order_id !== null &&
      (
        typeof client_order_id !== "string" ||
        !clientOrderId ||
        !isValidUuid(clientOrderId)
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid client_order_id",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // =================================================
    // 4. IDEMPOTENCY CHECK
    //
    // If the Landing retries the same request with the
    // same client_order_id, return the existing order
    // instead of creating a duplicate.
    // =================================================

    if (clientOrderId) {
      const {
        data: existingOrder,
        error: existingOrderError,
      } = await supabase
        .from("orders")
        .select("id, store_id, client_order_id")
        .eq("store_id", keyData.store_id)
        .eq("client_order_id", clientOrderId)
        .maybeSingle();

      if (existingOrderError) {
        console.error(
          "Idempotency lookup failed:",
          existingOrderError
        );

        return NextResponse.json(
          {
            success: false,
            error: "Idempotency check failed",
          },
          {
            status: 500,
            headers: corsHeaders,
          }
        );
      }

      if (existingOrder) {
        after(async () => {
          try {
            await supabase
              .from("api_keys")
              .update({
                last_used_at:
                  new Date().toISOString(),
              })
              .eq("api_key", apiKey);
          } catch (error) {
            console.error(
              "API key update unexpected error:",
              error
            );
          }
        });

        return NextResponse.json(
          {
            success: true,
            order_id: existingOrder.id,
            store_id: keyData.store_id,
            client_order_id: clientOrderId,
            idempotent: true,
            stock_alternatives:
              "already_created",
          },
          {
            status: 200,
            headers: corsHeaders,
          }
        );
      }
    }

    // =================================================
    // 5. NORMALIZE COLOR KEY
    //
    // Keep the original color exactly as received.
    // Unknown colors are accepted with color_key = null.
    // =================================================

    const colorKey =
      typeof color === "string"
        ? normalizeColor(color)
        : null;

    // =================================================
    // 6. CREATE ORDER
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

        client_order_id:
          clientOrderId,
      })
      .select()
      .single();

    if (
      orderError ||
      !order
    ) {
      // A concurrent retry may pass the first lookup and
      // collide on the unique (store_id, client_order_id)
      // index. In that case, return the order that won the
      // race instead of returning an error.
      if (
        orderError?.code === "23505" &&
        clientOrderId
      ) {
        const {
          data: racedOrder,
          error: racedOrderError,
        } = await supabase
          .from("orders")
          .select("id, store_id, client_order_id")
          .eq("store_id", keyData.store_id)
          .eq("client_order_id", clientOrderId)
          .maybeSingle();

        if (
          !racedOrderError &&
          racedOrder
        ) {
          return NextResponse.json(
            {
              success: true,
              order_id: racedOrder.id,
              store_id: keyData.store_id,
              client_order_id:
                clientOrderId,
              idempotent: true,
              stock_alternatives:
                "already_created",
            },
            {
              status: 200,
              headers: corsHeaders,
            }
          );
        }
      }

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

      client_order_id:
        order.client_order_id,
    });

    // =================================================
    // 7. BACKGROUND TASKS
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
    // 8. RETURN SUCCESS IMMEDIATELY
    // =================================================

    return NextResponse.json(
      {
        success: true,

        order_id:
          order.id,

        store_id:
          keyData.store_id,

        client_order_id:
          order.client_order_id,

        idempotent:
          false,

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