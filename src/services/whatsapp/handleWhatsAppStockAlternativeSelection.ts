import type { SupabaseClient } from "@supabase/supabase-js";
import { sendWhatsAppStockAlternativeConfirmed } from "./sendWhatsAppStockAlternativeConfirmed";

type SelectionResult =
  | {
      state: "completed";
      order_id: number;
      selected_variant_id: number;
      selected_color: string;
    }
  | {
      state: "not_available";
      reason: "variant_out_of_stock";
    }
  | {
      state: "ignored";
      reason:
        | "invalid_payload"
        | "request_not_found"
        | "request_not_pending"
        | "automation_disabled"
        | "variant_not_allowed"
        | "order_already_changed"
        | "order_size_changed"
        | "order_no_longer_editable";
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

function parseStockAlternativePayload(
  payload: string
) {
  const match =
    /^stock_alt:([^:]+):(\d+)$/.exec(
      payload.trim()
    );

  if (!match) {
    return null;
  }

  const requestId = match[1];
  const variantId = Number(match[2]);

  if (
    !requestId ||
    !Number.isFinite(variantId)
  ) {
    return null;
  }

  return {
    requestId,
    variantId,
  };
}

export async function handleWhatsAppStockAlternativeSelection(
  admin: SupabaseClient,
  params: {
    storeId: number;
    conversationId: number;
    payload: string;
  }
): Promise<SelectionResult> {
  try {
    // =====================================================
    // 1. PARSE BUTTON PAYLOAD
    // stock_alt:REQUEST_ID:VARIANT_ID
    // =====================================================

    const parsed =
      parseStockAlternativePayload(
        params.payload
      );

    if (!parsed) {
      return {
        state: "ignored",
        reason: "invalid_payload",
      };
    }

    const {
      requestId,
      variantId,
    } = parsed;

    // =====================================================
    // 2. LOAD STOCK ALTERNATIVE REQUEST
    // =====================================================

    const {
      data: stockRequest,
      error: requestError,
    } = await admin
      .from(
        "whatsapp_stock_alternative_requests"
      )
      .select(`
        id,
        store_id,
        order_id,
        original_color,
        original_size,
        available_variant_ids,
        selected_variant_id,
        status
      `)
      .eq("id", requestId)
      .eq(
        "store_id",
        params.storeId
      )
      .maybeSingle();

    if (requestError) {
      console.error(
        "Stock Alternative request lookup failed:",
        requestError
      );

      return {
        state: "failed",
        reason:
          "request_lookup_failed",
      };
    }

    if (!stockRequest) {
      return {
        state: "ignored",
        reason: "request_not_found",
      };
    }

    // =====================================================
    // 3. REQUEST MUST STILL BE PENDING
    // =====================================================

    if (
      stockRequest.status !==
      "pending"
    ) {
      return {
        state: "ignored",
        reason:
          "request_not_pending",
      };
    }

    // =====================================================
    // 4. RECHECK STORE AUTOMATION SETTING
    //
    // The Settings page is the master switch for the whole
    // Stock Alternatives flow. If the user disables the
    // feature after the message was sent, an old button must
    // not be able to change the order.
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
        params.storeId
      )
      .maybeSingle();

    if (settingsError) {
      console.error(
        "Stock Alternatives settings recheck failed:",
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
      console.log(
        "Stock Alternatives automation is disabled. Ignoring button:",
        {
          requestId,
          storeId:
            params.storeId,
        }
      );

      return {
        state: "ignored",
        reason:
          "automation_disabled",
      };
    }

    // =====================================================
    // 5. VARIANT MUST BELONG TO THE OPTIONS SENT
    // =====================================================

    const allowedVariantIds =
      Array.isArray(
        stockRequest.available_variant_ids
      )
        ? stockRequest.available_variant_ids
            .map((id: unknown) =>
              Number(id)
            )
            .filter(
              (id: number) =>
                Number.isFinite(id)
            )
        : [];

    if (
      !allowedVariantIds.includes(
        variantId
      )
    ) {
      console.error(
        "Selected variant is not part of request:",
        {
          requestId,
          variantId,
          allowedVariantIds,
        }
      );

      return {
        state: "ignored",
        reason:
          "variant_not_allowed",
      };
    }

    // =====================================================
    // 5. LOAD ORDER
    // =====================================================

    const {
      data: order,
      error: orderError,
    } = await admin
      .from("orders")
      .select(`
        id,
        store_id,
        product,
        color,
        size,
        status,
        shipping_stage
      `)
      .eq(
        "id",
        stockRequest.order_id
      )
      .eq(
        "store_id",
        params.storeId
      )
      .maybeSingle();

    if (orderError) {
      console.error(
        "Stock Alternative order lookup failed:",
        orderError
      );

      return {
        state: "failed",
        reason:
          "order_lookup_failed",
      };
    }

    if (!order) {
      return {
        state: "failed",
        reason: "order_not_found",
      };
    }

    // =====================================================
    // 6. DO NOT TOUCH CLOSED / SHIPPED ORDERS
    // =====================================================

    const normalizedStatus =
      normalizeValue(order.status);

    const normalizedShippingStage =
      normalizeValue(
        order.shipping_stage
      );

    if (
      normalizedStatus !==
        "nouvelle" ||
      normalizedShippingStage ===
        "sent"
    ) {
      return {
        state: "ignored",
        reason:
          "order_no_longer_editable",
      };
    }

    // =====================================================
    // 7. MAKE SURE STAFF DID NOT ALREADY CHANGE COLOR/SIZE
    // =====================================================

    const originalColor =
      normalizeValue(
        stockRequest.original_color
      );

    const originalSize =
      normalizeValue(
        stockRequest.original_size
      );

    if (
      normalizeValue(order.color) !==
      originalColor
    ) {
      return {
        state: "ignored",
        reason:
          "order_already_changed",
      };
    }

    if (
      normalizeValue(order.size) !==
      originalSize
    ) {
      return {
        state: "ignored",
        reason:
          "order_size_changed",
      };
    }

    // =====================================================
    // 8. FIND STOCK PRODUCT
    // =====================================================

    if (!order.product) {
      return {
        state: "failed",
        reason:
          "order_product_missing",
      };
    }

    const {
      data: stockProduct,
      error: stockProductError,
    } = await admin
      .from("stock_products")
      .select("id, name")
      .eq(
        "store_id",
        params.storeId
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
        state: "failed",
        reason:
          "stock_product_not_found",
      };
    }

    // =====================================================
    // 9. RELOAD SELECTED VARIANT FROM CURRENT STOCK
    //
    // IMPORTANT:
    // We do NOT trust the old quantity saved when the
    // WhatsApp message was prepared.
    // =====================================================

    const {
      data: selectedVariant,
      error: variantError,
    } = await admin
      .from("stock_variants")
      .select(`
        id,
        product_id,
        color,
        size,
        quantity,
        image_url
      `)
      .eq("id", variantId)
      .eq(
        "product_id",
        stockProduct.id
      )
      .maybeSingle();

    if (variantError) {
      console.error(
        "Selected stock variant lookup failed:",
        variantError
      );

      return {
        state: "failed",
        reason:
          "selected_variant_lookup_failed",
      };
    }

    if (!selectedVariant) {
      return {
        state: "failed",
        reason:
          "selected_variant_not_found",
      };
    }

    // =====================================================
    // 10. SAME SIZE ONLY
    // =====================================================

    if (
      normalizeValue(
        selectedVariant.size
      ) !== originalSize
    ) {
      console.error(
        "Selected variant size mismatch:",
        {
          orderId: order.id,
          originalSize:
            stockRequest.original_size,
          selectedSize:
            selectedVariant.size,
        }
      );

      return {
        state: "failed",
        reason:
          "selected_variant_size_mismatch",
      };
    }

    // =====================================================
    // 11. RECHECK QUANTITY NOW
    // =====================================================

    if (
      Number(
        selectedVariant.quantity
      ) <= 0
    ) {
      console.log(
        "Selected WhatsApp alternative is now out of stock:",
        {
          requestId,
          variantId,
        }
      );

      // Keep request pending.
      // Customer may still choose another button.
      return {
        state: "not_available",
        reason:
          "variant_out_of_stock",
      };
    }

    if (!selectedVariant.color) {
      return {
        state: "failed",
        reason:
          "selected_variant_color_missing",
      };
    }

    // =====================================================
    // 12. UPDATE ORDER COLOR
    //
    // We update ONLY the color.
    // Size/pointure stays unchanged.
    //
    // The conditions on old color + size also protect us
    // from overwriting a manual change made at the same time.
    // =====================================================

    const now =
      new Date().toISOString();

    const {
      data: updatedOrder,
      error: updateOrderError,
    } = await admin
      .from("orders")
      .update({
        color:
          selectedVariant.color,

        updated_at: now,
      })
      .eq("id", order.id)
      .eq(
        "store_id",
        params.storeId
      )
      .eq("color", order.color)
      .eq("size", order.size)
      .select(
        "id, color, size"
      )
      .maybeSingle();

    if (updateOrderError) {
      console.error(
        "WhatsApp Stock Alternative order update failed:",
        updateOrderError
      );

      return {
        state: "failed",
        reason:
          "order_update_failed",
      };
    }

    if (!updatedOrder) {
      console.warn(
        "Order changed while processing WhatsApp selection:",
        order.id
      );

      return {
        state: "ignored",
        reason:
          "order_already_changed",
      };
    }

    // =====================================================
    // 13. COMPLETE REQUEST / SAVE HISTORY
    // =====================================================

    const {
      data: completedRequest,
      error: completeError,
    } = await admin
      .from(
        "whatsapp_stock_alternative_requests"
      )
      .update({
        selected_variant_id:
          selectedVariant.id,

        status: "completed",

        whatsapp_conversation_id:
          params.conversationId,

        updated_at: now,

        completed_at: now,
      })
      .eq("id", stockRequest.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (completeError) {
      console.error(
        "Stock Alternative request completion failed:",
        completeError
      );

      return {
        state: "failed",
        reason:
          "request_completion_failed",
      };
    }

    if (!completedRequest) {
      console.warn(
        "Stock Alternative request was already processed:",
        stockRequest.id
      );
    } else {
      // ===================================================
      // 14. SEND FINAL CONFIRMATION MESSAGE
      //
      // Important:
      // - The order color change is already completed.
      // - A WhatsApp send failure must NOT roll back or mark
      //   the customer's selection as failed.
      // - The sender has its own duplicate protection and
      //   failure tracking fields on this request.
      // ===================================================

      const confirmationResult =
        await sendWhatsAppStockAlternativeConfirmed(
          admin,
          String(stockRequest.id)
        );

      console.log(
        "Stock Alternative final confirmation result:",
        confirmationResult
      );
    }

    console.log(
      "===== WHATSAPP STOCK ALTERNATIVE COMPLETED ====="
    );

    console.log({
      request_id:
        stockRequest.id,

      order_id:
        order.id,

      old_color:
        stockRequest.original_color,

      new_color:
        selectedVariant.color,

      size:
        selectedVariant.size,

      variant_id:
        selectedVariant.id,
    });

    return {
      state: "completed",
      order_id:
        Number(order.id),

      selected_variant_id:
        Number(selectedVariant.id),

      selected_color:
        String(selectedVariant.color),
    };
  } catch (error) {
    console.error(
      "Unexpected WhatsApp Stock Alternative selection error:",
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