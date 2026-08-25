import type { SupabaseClient } from "@supabase/supabase-js";

type AutomationResult =
  | { state: "disabled" }
  | { state: "not_needed"; reason: "variant_available" | "no_stock_product" | "no_alternatives" }
  | { state: "created"; request_id: string }
  | { state: "already_exists" }
  | { state: "failed"; reason: string };

function normalizeValue(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

/**
 * Stage 1 of WhatsApp Stock Alternatives:
 * - checks the store automation setting
 * - checks the requested variant
 * - finds alternative colors with the same product + size/pointure
 * - creates one pending request
 *
 * IMPORTANT: this stage does NOT send WhatsApp yet.
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
  if (!order.product || !order.color || !order.size) {
    return {
      state: "not_needed",
      reason: "no_stock_product",
    };
  }

  // 1. Store-level automation switch
  const { data: settings, error: settingsError } = await admin
    .from("whatsapp_automation_settings")
    .select("stock_alternatives_enabled")
    .eq("store_id", order.store_id)
    .maybeSingle();

  if (settingsError) {
    console.error("Stock Alternatives settings lookup failed:", settingsError);
    return {
      state: "failed",
      reason: "settings_lookup_failed",
    };
  }

  if (!settings?.stock_alternatives_enabled) {
    return { state: "disabled" };
  }

  // 2. Find the exact stock product for this store
  const { data: stockProduct, error: stockProductError } = await admin
    .from("stock_products")
    .select("id, name")
    .eq("store_id", order.store_id)
    .eq("name", order.product)
    .maybeSingle();

  if (stockProductError) {
    console.error("Stock product lookup failed:", stockProductError);
    return {
      state: "failed",
      reason: "stock_product_lookup_failed",
    };
  }

  if (!stockProduct) {
    return {
      state: "not_needed",
      reason: "no_stock_product",
    };
  }

  // 3. Load all variants for that product
  const { data: variants, error: variantsError } = await admin
    .from("stock_variants")
    .select("id, product_id, color, size, image_url, quantity")
    .eq("product_id", stockProduct.id);

  if (variantsError) {
    console.error("Stock variants lookup failed:", variantsError);
    return {
      state: "failed",
      reason: "stock_variants_lookup_failed",
    };
  }

  if (!variants || variants.length === 0) {
    return {
      state: "not_needed",
      reason: "no_alternatives",
    };
  }

  const requestedColor = normalizeValue(order.color);
  const requestedSize = normalizeValue(order.size);

  // 4. Exact requested variant
  const requestedVariant = variants.find(
    (variant) =>
      normalizeValue(variant.color) === requestedColor &&
      normalizeValue(variant.size) === requestedSize
  );

  // If the requested exact variant exists and has stock, there is nothing to automate.
  if (requestedVariant && Number(requestedVariant.quantity) > 0) {
    return {
      state: "not_needed",
      reason: "variant_available",
    };
  }

  // 5. Find alternatives:
  //    same product + same size/pointure + quantity > 0 + different color + image
  const byColor = new Map<string, typeof variants[number]>();

  for (const variant of variants) {
    const color = normalizeValue(variant.color);
    const size = normalizeValue(variant.size);

    if (!color || color === requestedColor) continue;
    if (size !== requestedSize) continue;
    if (Number(variant.quantity) <= 0) continue;
    if (!variant.image_url) continue;

    if (!byColor.has(color)) {
      byColor.set(color, variant);
    }
  }

  const alternatives = Array.from(byColor.values());

  if (alternatives.length === 0) {
    return {
      state: "not_needed",
      reason: "no_alternatives",
    };
  }

  // 6. Idempotency guard for this automation/order.
  const { data: existingRequest, error: existingRequestError } = await admin
    .from("whatsapp_stock_alternative_requests")
    .select("id, status")
    .eq("order_id", order.id)
    .in("status", ["pending", "completed"])
    .maybeSingle();

  if (existingRequestError) {
    console.error(
      "Stock Alternatives existing request lookup failed:",
      existingRequestError
    );
    return {
      state: "failed",
      reason: "existing_request_lookup_failed",
    };
  }

  if (existingRequest) {
    return { state: "already_exists" };
  }

  // 7. Create the pending request. No WhatsApp message is sent yet.
  const { data: createdRequest, error: requestError } = await admin
    .from("whatsapp_stock_alternative_requests")
    .insert({
      store_id: order.store_id,
      order_id: order.id,
      original_color: order.color,
      original_size: order.size,
      available_variant_ids: alternatives.map((variant) => variant.id),
      status: "pending",
      source: "whatsapp",
    })
    .select("id")
    .single();

  if (requestError) {
    // The unique partial index protects us against concurrent duplicate triggers.
    if (requestError.code === "23505") {
      return { state: "already_exists" };
    }

    console.error(
      "Stock Alternatives request creation failed:",
      requestError
    );
    return {
      state: "failed",
      reason: "request_creation_failed",
    };
  }

  return {
    state: "created",
    request_id: String(createdRequest.id),
  };
}