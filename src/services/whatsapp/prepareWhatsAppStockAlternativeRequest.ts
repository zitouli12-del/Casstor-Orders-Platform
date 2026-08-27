import type { SupabaseClient } from "@supabase/supabase-js";

import {
  sendWhatsAppStockAlternative,
} from "./sendWhatsAppStockAlternative";

type AutomationResult =
  | { state: "disabled" }
  | {
      state: "not_needed";
      reason:
        | "variant_available"
        | "no_stock_product"
        | "no_alternatives";
    }
  | {
      state: "sent";
      request_id: string;
      whatsapp_message_id: string | null;
    }
  | {
      state: "already_exists";
    }
  | {
      state: "failed";
      reason: string;
    };

function normalizeValue(
  value: string | null | undefined
) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

/**
 * WhatsApp Stock Alternatives
 *
 * Flow:
 * 1. Check Store setting
 * 2. Check requested variant
 * 3. Find same product + same size + other colors
 * 4. Keep maximum 3 alternatives
 * 5. Create pending request
 * 6. Send WhatsApp template automatically
 */
export async function prepareWhatsAppStockAlternativeRequest(
  admin: SupabaseClient,
  order: {
    id: number;
    store_id: number;
    product: string | null;
    color: string | null;
    size: string | null;
  }
): Promise<AutomationResult> {
  try {
    // =====================================================
    // 1. BASIC ORDER DATA
    // =====================================================

    if (
      !order.product ||
      !order.color ||
      !order.size
    ) {
      return {
        state: "not_needed",
        reason: "no_stock_product",
      };
    }

    // =====================================================
    // 2. STORE AUTOMATION SETTING
    // =====================================================

    const {
      data: settings,
      error: settingsError,
    } = await admin
      .from(
        "whatsapp_automation_settings"
      )
      .select(
        "stock_alternatives_enabled"
      )
      .eq(
        "store_id",
        order.store_id
      )
      .maybeSingle();

    if (settingsError) {
      console.error(
        "Stock Alternatives settings lookup failed:",
        settingsError
      );

      return {
        state: "failed",
        reason:
          "settings_lookup_failed",
      };
    }

    if (
      !settings?.stock_alternatives_enabled
    ) {
      return {
        state: "disabled",
      };
    }

    // =====================================================
    // 3. FIND STOCK PRODUCT
    // =====================================================

    const {
      data: stockProduct,
      error: stockProductError,
    } = await admin
      .from("stock_products")
      .select(
        "id, name"
      )
      .eq(
        "store_id",
        order.store_id
      )
      .eq(
        "name",
        order.product
      )
      .maybeSingle();

    if (stockProductError) {
      console.error(
        "Stock product lookup failed:",
        stockProductError
      );

      return {
        state: "failed",
        reason:
          "stock_product_lookup_failed",
      };
    }

    if (!stockProduct) {
      return {
        state: "not_needed",
        reason: "no_stock_product",
      };
    }

    // =====================================================
    // 4. LOAD PRODUCT VARIANTS
    // =====================================================

    const {
      data: variants,
      error: variantsError,
    } = await admin
      .from("stock_variants")
      .select(`
        id,
        product_id,
        color,
        size,
        image_url,
        quantity
      `)
      .eq(
        "product_id",
        stockProduct.id
      );

    if (variantsError) {
      console.error(
        "Stock variants lookup failed:",
        variantsError
      );

      return {
        state: "failed",
        reason:
          "stock_variants_lookup_failed",
      };
    }

    if (
      !variants ||
      variants.length === 0
    ) {
      return {
        state: "not_needed",
        reason: "no_alternatives",
      };
    }

    const requestedColor =
      normalizeValue(
        order.color
      );

    const requestedSize =
      normalizeValue(
        order.size
      );

    // =====================================================
    // 5. CHECK EXACT REQUESTED VARIANT
    // =====================================================

    const requestedVariant =
      variants.find(
        (variant) =>
          normalizeValue(
            variant.color
          ) === requestedColor &&
          normalizeValue(
            variant.size
          ) === requestedSize
      );

    // Requested color + size is available.
    // Nothing to automate.
    if (
      requestedVariant &&
      Number(
        requestedVariant.quantity
      ) > 0
    ) {
      return {
        state: "not_needed",
        reason:
          "variant_available",
      };
    }

    // =====================================================
    // 6. FIND ALTERNATIVE COLORS
    //
    // Rules:
    // - same product
    // - exact same size / pointure
    // - different color
    // - quantity > 0
    // - must have image
    // =====================================================

    const byColor =
      new Map<
        string,
        (typeof variants)[number]
      >();

    for (
      const variant of variants
    ) {
      const color =
        normalizeValue(
          variant.color
        );

      const size =
        normalizeValue(
          variant.size
        );

      if (!color) {
        continue;
      }

      if (
        color ===
        requestedColor
      ) {
        continue;
      }

      if (
        size !== requestedSize
      ) {
        continue;
      }

      if (
        Number(
          variant.quantity
        ) <= 0
      ) {
        continue;
      }

      if (
        !variant.image_url
      ) {
        continue;
      }

      if (
        !byColor.has(color)
      ) {
        byColor.set(
          color,
          variant
        );
      }
    }

    // =====================================================
    // 7. KEEP MAXIMUM 3 COLORS
    //
    // Priority:
    // highest quantity first
    // =====================================================

    const alternatives =
      Array.from(
        byColor.values()
      )
        .sort(
          (a, b) => {
            const quantityDifference =
              Number(
                b.quantity
              ) -
              Number(
                a.quantity
              );

            if (
              quantityDifference !==
              0
            ) {
              return quantityDifference;
            }

            return (
              Number(a.id) -
              Number(b.id)
            );
          }
        )
        .slice(0, 3);

    if (
      alternatives.length === 0
    ) {
      return {
        state: "not_needed",
        reason:
          "no_alternatives",
      };
    }

    // =====================================================
    // 8. IDEMPOTENCY
    //
    // Prevent multiple active/completed requests
    // for the same order.
    // =====================================================

    const {
      data: existingRequest,
      error:
        existingRequestError,
    } = await admin
      .from(
        "whatsapp_stock_alternative_requests"
      )
      .select(`
        id,
        status,
        whatsapp_message_id
      `)
      .eq(
        "order_id",
        order.id
      )
      .in(
        "status",
        [
          "pending",
          "completed",
        ]
      )
      .maybeSingle();

    if (
      existingRequestError
    ) {
      console.error(
        "Stock Alternatives existing request lookup failed:",
        existingRequestError
      );

      return {
        state: "failed",
        reason:
          "existing_request_lookup_failed",
      };
    }

    if (existingRequest) {
      console.log(
        "Stock Alternative request already exists:",
        existingRequest.id
      );

      return {
        state:
          "already_exists",
      };
    }

    // =====================================================
    // 9. CREATE PENDING REQUEST
    // =====================================================

    const {
      data: createdRequest,
      error: requestError,
    } = await admin
      .from(
        "whatsapp_stock_alternative_requests"
      )
      .insert({
        store_id:
          order.store_id,

        order_id:
          order.id,

        original_color:
          order.color,

        original_size:
          order.size,

        available_variant_ids:
          alternatives.map(
            (variant) =>
              variant.id
          ),

        status:
          "pending",

        source:
          "whatsapp",
      })
      .select("id")
      .single();

    if (requestError) {
      // Unique partial index protection
      if (
        requestError.code ===
        "23505"
      ) {
        return {
          state:
            "already_exists",
        };
      }

      console.error(
        "Stock Alternatives request creation failed:",
        requestError
      );

      return {
        state: "failed",
        reason:
          "request_creation_failed",
      };
    }

    const requestId =
      String(
        createdRequest.id
      );

    console.log(
      "===== STOCK ALTERNATIVE REQUEST CREATED ====="
    );

    console.log({
      request_id:
        requestId,

      order_id:
        order.id,

      alternatives:
        alternatives.map(
          (variant) => ({
            id:
              variant.id,

            color:
              variant.color,

            size:
              variant.size,

            quantity:
              variant.quantity,
          })
        ),
    });

    // =====================================================
    // 10. SEND WHATSAPP AUTOMATICALLY
    // =====================================================

    const sendResult =
      await sendWhatsAppStockAlternative(
        admin,
        requestId
      );

    console.log(
      "Stock Alternative WhatsApp send result:",
      sendResult
    );

    // =====================================================
    // 11. HANDLE SEND FAILURE
    // =====================================================

    if (
      sendResult.state !==
      "sent"
    ) {
      console.error(
        "Stock Alternative WhatsApp was not sent:",
        {
          request_id:
            requestId,

          reason:
            sendResult.reason,
        }
      );

      return {
        state: "failed",
        reason:
          `whatsapp_send_failed:${sendResult.reason}`,
      };
    }

    // =====================================================
    // 12. SUCCESS
    // =====================================================

    console.log(
      "===== STOCK ALTERNATIVE WHATSAPP SENT ====="
    );

    console.log({
      request_id:
        requestId,

      order_id:
        order.id,

      whatsapp_message_id:
        sendResult.whatsapp_message_id,

      conversation_id:
        sendResult.conversation_id,
    });

    return {
      state: "sent",

      request_id:
        requestId,

      whatsapp_message_id:
        sendResult.whatsapp_message_id,
    };
  } catch (error) {
    console.error(
      "Unexpected WhatsApp Stock Alternatives error:",
      error
    );

    return {
      state: "failed",
      reason:
        error instanceof Error
          ? error.message
          : "unexpected_error",
    };
  }
}