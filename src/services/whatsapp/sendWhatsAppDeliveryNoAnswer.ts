import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeColor } from "@/src/lib/colors";

const GRAPH_API_VERSION = "v26.0";
const TEMPLATE_LANGUAGE = "ar";

const TEMPLATE_INITIAL = "delivery_no_answer_initial";
const TEMPLATE_FOLLOWUP_IMAGE = "delivery_no_answer_followup_image";
const TEMPLATE_FOLLOWUP_TEXT = "delivery_no_answer_followup_text";
const TEMPLATE_FALLBACK = "delivery_no_answer_fallback";

type DeliveryNoAnswerAutomationKey =
  | "delivery_no_answer_initial"
  | "delivery_no_answer_followup";

type SendResult =
  | {
      state: "sent";
      run_id: string;
      conversation_id: number;
      outgoing_message_id: number | null;
      whatsapp_message_id: string | null;
      template_name: string;
    }
  | {
      state: "ignored";
      reason: string;
    }
  | {
      state: "failed";
      reason: string;
    };

type BodyParameter = {
  type: "text";
  parameter_name: string;
  text: string;
};

function normalizeValue(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeMoroccanPhone(phone: string) {
  let value = phone.replace(/\D/g, "");

  if (value.startsWith("0")) {
    value = "212" + value.slice(1);
  }

  return value;
}

function hasText(value: unknown) {
  return String(value ?? "").trim().length > 0;
}

function isUsableImageUrl(value: unknown) {
  const raw = String(value ?? "").trim();

  if (!raw) return false;

  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isInitialStatus(status: unknown) {
  const value = normalizeValue(status);

  return [
    "Pas de réponse + SMS",
    "pas réponse +déplacement",
  ].some((item) => normalizeValue(item) === value);
}

function isFollowupStatus(status: unknown) {
  const value = normalizeValue(status);

  return [
    "Pas de réponse J+2",
    "Pas de réponse J+3",
    "pas réponse + déplacement J+2",
    "pas réponse + déplacement J+3",
  ].some((item) => normalizeValue(item) === value);
}

function buildCourierParameters(params: {
  customerName: string;
  productName: string;
  courierName: string;
  courierPhone: string;
}): BodyParameter[] {
  return [
    {
      type: "text",
      parameter_name: "customer_name",
      text: params.customerName,
    },
    {
      type: "text",
      parameter_name: "product_name",
      text: params.productName,
    },
    {
      type: "text",
      parameter_name: "courier_name",
      text: params.courierName,
    },
    {
      type: "text",
      parameter_name: "courier_phone",
      text: params.courierPhone,
    },
  ];
}

function buildFallbackParameters(params: {
  customerName: string;
  productName: string;
}): BodyParameter[] {
  return [
    {
      type: "text",
      parameter_name: "customer_name",
      text: params.customerName,
    },
    {
      type: "text",
      parameter_name: "product_name",
      text: params.productName,
    },
  ];
}

function buildLocalTemplateBody(params: {
  templateName: string;
  customerName: string;
  productName: string;
  courierName: string;
  courierPhone: string;
}) {
  const {
    templateName,
    customerName,
    productName,
    courierName,
    courierPhone,
  } = params;

  if (templateName === TEMPLATE_FALLBACK) {
    return (
      `مرحباً ${customerName} 👋\n\n` +
      `حاول موزع شركة التوصيل التواصل معكم بخصوص تسليم طلبكم ${productName}، لكنه لم يتمكن من الوصول إليكم.\n\n` +
      `إذا أردتم تنسيق موعد التسليم أو واجهتكم أي مشكلة بخصوص التوصيل، ما عليكم إلا الرد مباشرة على هذه الرسالة وسنكون في الخدمة لمساعدتكم.\n\n` +
      `شكراً لتفهمكم! 📦✨`
    );
  }

  if (templateName === TEMPLATE_INITIAL) {
    return (
      `مرحباً ${customerName} 👋\n\n` +
      `حاول موزع شركة التوصيل التواصل معكم بخصوص تسليم طلبكم ${productName}، لكنه لم يتمكن من الوصول إليكم.\n\n` +
      `يرجى التواصل معه عبر الاتصال أو الواتساب لتنسيق وقت مناسب للتسليم:\n\n` +
      `الموزع: ${courierName}\n` +
      `رقم الهاتف (اتصال / واتساب): ${courierPhone}\n\n` +
      `إذا واجهتكم أي مشكلة أو أردتم تغيير موعد التسليم، ما عليكم إلا الرد على هذه الرسالة وسنكون في الخدمة لمساعدتكم.\n\n` +
      `شكراً لتفهمكم! 📦✨`
    );
  }

  const imageSentence =
    templateName === TEMPLATE_FOLLOWUP_IMAGE
      ? `نذكركم بخصوص طلبكم ${productName} الموضح في الصورة أعلاه.\n\n`
      : `نذكركم بخصوص طلبكم ${productName}.\n\n`;

  return (
    `مرحباً ${customerName} 👋\n\n` +
    imageSentence +
    `سبق لموزع شركة التوصيل محاولة التواصل معكم من أجل تسليم الطلب، لكنه لم يتمكن من الوصول إليكم.\n\n` +
    `يرجى التواصل معه عبر الاتصال أو الواتساب لتنسيق وقت مناسب للتسليم:\n\n` +
    `الموزع: ${courierName}\n` +
    `رقم الهاتف (اتصال / واتساب): ${courierPhone}\n\n` +
    `إذا واجهتكم أي مشكلة أو أردتم تغيير موعد التسليم، ما عليكم إلا الرد على هذه الرسالة وسنكون في الخدمة لمساعدتكم.\n\n` +
    `شكراً لتفهمكم! 📦✨`
  );
}

async function failRun(
  admin: SupabaseClient,
  runId: string,
  attemptCount: number,
  reason: string
) {
  const { error } = await admin
    .from("whatsapp_shipping_automation_runs")
    .update({
      status: "failed",
      attempt_count: attemptCount,
      last_error: reason.slice(0, 1000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (error) {
    console.error(
      "Delivery No Answer run failure update failed:",
      error
    );
  }
}

async function cancelRun(
  admin: SupabaseClient,
  runId: string,
  reason: string
) {
  const { error } = await admin
    .from("whatsapp_shipping_automation_runs")
    .update({
      status: "cancelled",
      last_error: reason.slice(0, 1000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (error) {
    console.error(
      "Delivery No Answer run cancellation update failed:",
      error
    );
  }
}

async function findProductImage(
  admin: SupabaseClient,
  params: {
    storeId: number;
    productName: string;
    color: string;
    colorKey?: string | null;
    size: string;
  }
): Promise<{
  imageUrl: string | null;
  diagnostic: string | null;
}> {
  try {
    if (
      !hasText(params.productName) ||
      !hasText(params.color) ||
      !hasText(params.size)
    ) {
      return {
        imageUrl: null,
        diagnostic: "fallback_missing_variant_identity",
      };
    }

    const { data: stockProduct, error: stockProductError } =
      await admin
        .from("stock_products")
        .select("id, name")
        .eq("store_id", params.storeId)
        .eq("name", params.productName)
        .maybeSingle();

    if (stockProductError) {
      console.error(
        "Delivery No Answer stock product lookup failed:",
        stockProductError
      );

      return {
        imageUrl: null,
        diagnostic: "fallback_stock_product_lookup_failed",
      };
    }

    if (!stockProduct) {
      return {
        imageUrl: null,
        diagnostic: "fallback_stock_product_not_found",
      };
    }

    const { data: variants, error: variantsError } = await admin
      .from("stock_variants")
      .select(`
        id,
        product_id,
        color,
        color_key,
        size,
        image_url
      `)
      .eq("product_id", stockProduct.id);

    if (variantsError) {
      console.error(
        "Delivery No Answer stock variants lookup failed:",
        variantsError
      );

      return {
        imageUrl: null,
        diagnostic: "fallback_stock_variants_lookup_failed",
      };
    }

    const requestedColorKey =
      String(params.colorKey || "").trim() ||
      normalizeColor(params.color);

    const normalizedColor = normalizeValue(params.color);
    const normalizedSize = normalizeValue(params.size);

    const variant = (variants || []).find((item) => {
      if (normalizeValue(item.size) !== normalizedSize) {
        return false;
      }

      if (requestedColorKey) {
        const variantColorKey =
          String(item.color_key || "").trim() ||
          normalizeColor(item.color);

        return variantColorKey === requestedColorKey;
      }

      // Safe legacy fallback for unknown colors: only exact text match.
      return normalizeValue(item.color) === normalizedColor;
    });

    if (!variant) {
      return {
        imageUrl: null,
        diagnostic: "fallback_exact_variant_not_found",
      };
    }

    const imageUrl = String(variant.image_url ?? "").trim();

    if (!isUsableImageUrl(imageUrl)) {
      return {
        imageUrl: null,
        diagnostic: "fallback_variant_image_missing",
      };
    }

    return {
      imageUrl,
      diagnostic: null,
    };
  } catch (error) {
    console.error(
      "Unexpected Delivery No Answer image lookup error:",
      error
    );

    return {
      imageUrl: null,
      diagnostic: "fallback_image_lookup_unexpected_error",
    };
  }
}

export async function sendWhatsAppDeliveryNoAnswer(
  admin: SupabaseClient,
  runId: string
): Promise<SendResult> {
  try {
    // =====================================================
    // 1. LOAD AUTOMATION RUN
    // =====================================================

    const { data: automationRun, error: runError } = await admin
      .from("whatsapp_shipping_automation_runs")
      .select(`
        id,
        store_id,
        shipping_id,
        order_id,
        automation_key,
        trigger_status,
        conversation_id,
        outgoing_message_id,
        status,
        attempt_count,
        sent_at
      `)
      .eq("id", runId)
      .maybeSingle();

    if (runError || !automationRun) {
      console.error(
        "Delivery No Answer run lookup failed:",
        runError
      );

      return {
        state: "failed",
        reason: "automation_run_not_found",
      };
    }

    const automationKey = String(
      automationRun.automation_key || ""
    ) as DeliveryNoAnswerAutomationKey;

    if (
      automationKey !== "delivery_no_answer_initial" &&
      automationKey !== "delivery_no_answer_followup"
    ) {
      return {
        state: "ignored",
        reason: "wrong_automation_key",
      };
    }

    if (
      automationRun.status === "sent" ||
      automationRun.outgoing_message_id ||
      automationRun.sent_at
    ) {
      return {
        state: "ignored",
        reason: "already_sent",
      };
    }

    if (automationRun.status !== "pending") {
      return {
        state: "ignored",
        reason: "run_not_pending",
      };
    }

    // =====================================================
    // 2. RECHECK STORE SETTING
    // =====================================================

    const { data: settings, error: settingsError } = await admin
      .from("whatsapp_automation_settings")
      .select("delivery_no_answer_enabled")
      .eq("store_id", automationRun.store_id)
      .maybeSingle();

    if (settingsError) {
      console.error(
        "Delivery No Answer settings lookup failed:",
        settingsError
      );

      await failRun(
        admin,
        automationRun.id,
        Number(automationRun.attempt_count || 0),
        "settings_lookup_failed"
      );

      return {
        state: "failed",
        reason: "settings_lookup_failed",
      };
    }

    if (!settings?.delivery_no_answer_enabled) {
      await cancelRun(
        admin,
        automationRun.id,
        "automation_disabled"
      );

      return {
        state: "ignored",
        reason: "automation_disabled",
      };
    }

    // =====================================================
    // 3. REGISTER THIS LOGICAL SEND ATTEMPT
    // =====================================================

    const previousAttemptCount = Number(
      automationRun.attempt_count || 0
    );
    const nextAttemptCount = previousAttemptCount + 1;

    const { data: attemptRun, error: attemptError } = await admin
      .from("whatsapp_shipping_automation_runs")
      .update({
        attempt_count: nextAttemptCount,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", automationRun.id)
      .eq("status", "pending")
      .eq("attempt_count", previousAttemptCount)
      .select("id")
      .maybeSingle();

    if (attemptError) {
      console.error(
        "Delivery No Answer attempt registration failed:",
        attemptError
      );

      return {
        state: "failed",
        reason: "attempt_update_failed",
      };
    }

    if (!attemptRun) {
      return {
        state: "ignored",
        reason: "attempt_already_started",
      };
    }

    // =====================================================
    // 4. LOAD CURRENT SHIPMENT
    // =====================================================

    const { data: shipment, error: shipmentError } = await admin
      .from("shipping")
      .select(`
        id,
        order_id,
        store_id,
        shipping_status,
        tracking_number,
        customer_name,
        customer_phone,
        parcel_product,
        parcel_color,
        parcel_color_key,
        parcel_size,
        courier_name,
        courier_phone
      `)
      .eq("id", automationRun.shipping_id)
      .eq("store_id", automationRun.store_id)
      .eq("order_id", automationRun.order_id)
      .maybeSingle();

    if (shipmentError || !shipment) {
      console.error(
        "Delivery No Answer shipment lookup failed:",
        shipmentError
      );

      await failRun(
        admin,
        automationRun.id,
        nextAttemptCount,
        "shipment_not_found"
      );

      return {
        state: "failed",
        reason: "shipment_not_found",
      };
    }

    // =====================================================
    // 5. RECHECK CURRENT SHIPPING FAMILY
    // =====================================================

    const currentStatus = shipment.shipping_status;

    const currentStatusMatches =
      automationKey === "delivery_no_answer_initial"
        ? isInitialStatus(currentStatus)
        : isFollowupStatus(currentStatus);

    if (!currentStatusMatches) {
      await cancelRun(
        admin,
        automationRun.id,
        "shipment_no_longer_in_automation_status_family"
      );

      return {
        state: "ignored",
        reason: "shipment_status_changed",
      };
    }

    // =====================================================
    // 6. LOAD ORDER AS FALLBACK DATA
    // =====================================================

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select(`
        id,
        store_id,
        name,
        phone,
        product,
        color,
        color_key,
        size
      `)
      .eq("id", automationRun.order_id)
      .eq("store_id", automationRun.store_id)
      .maybeSingle();

    if (orderError) {
      console.error(
        "Delivery No Answer order lookup failed:",
        orderError
      );
    }

    const customerName = String(
      shipment.customer_name || order?.name || "عميلنا"
    ).trim();

    const recipientPhone = normalizeMoroccanPhone(
      String(shipment.customer_phone || order?.phone || "")
    );

    if (!recipientPhone) {
      await failRun(
        admin,
        automationRun.id,
        nextAttemptCount,
        "customer_phone_missing"
      );

      return {
        state: "failed",
        reason: "customer_phone_missing",
      };
    }

    const productName = String(
      shipment.parcel_product || order?.product || "المنتج المطلوب"
    ).trim();

    const productColor = String(
      shipment.parcel_color || order?.color || ""
    ).trim();

    const productColorKey =
      String(shipment.parcel_color_key || "").trim() ||
      normalizeColor(productColor) ||
      (!shipment.parcel_color
        ? String(order?.color_key || "").trim()
        : "");

    const productSize = String(
      shipment.parcel_size || order?.size || ""
    ).trim();

    const courierName = String(
      shipment.courier_name || ""
    ).trim();

    const courierPhone = String(
      shipment.courier_phone || ""
    ).trim();

    const hasCourierInfo =
      hasText(courierName) && hasText(courierPhone);

    // =====================================================
    // 7. LOAD ACTIVE WHATSAPP CONNECTION
    // =====================================================

    const { data: connection, error: connectionError } = await admin
      .from("whatsapp_connections")
      .select(`
        id,
        store_id,
        phone_number_id,
        access_token,
        is_active
      `)
      .eq("store_id", automationRun.store_id)
      .eq("is_active", true)
      .maybeSingle();

    if (connectionError || !connection) {
      console.error(
        "Delivery No Answer WhatsApp connection lookup failed:",
        connectionError
      );

      await failRun(
        admin,
        automationRun.id,
        nextAttemptCount,
        "connection_not_found"
      );

      return {
        state: "failed",
        reason: "connection_not_found",
      };
    }

    if (!connection.phone_number_id || !connection.access_token) {
      await failRun(
        admin,
        automationRun.id,
        nextAttemptCount,
        "connection_incomplete"
      );

      return {
        state: "failed",
        reason: "connection_incomplete",
      };
    }

    // Preserve the narrowed non-null values for nested helpers.
    const phoneNumberId = connection.phone_number_id;
    const accessToken = connection.access_token;

    // =====================================================
    // 8. FIND OR CREATE CONVERSATION
    // =====================================================

    const {
      data: orderConversation,
      error: orderConversationError,
    } = await admin
      .from("whatsapp_conversations")
      .select(`
        id,
        store_id,
        order_id,
        phone,
        customer_name
      `)
      .eq("store_id", automationRun.store_id)
      .eq("order_id", automationRun.order_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderConversationError) {
      console.error(
        "Delivery No Answer order conversation lookup failed:",
        orderConversationError
      );

      await failRun(
        admin,
        automationRun.id,
        nextAttemptCount,
        "conversation_lookup_failed"
      );

      return {
        state: "failed",
        reason: "conversation_lookup_failed",
      };
    }

    let conversation = orderConversation;

    if (!conversation) {
      const {
        data: phoneConversation,
        error: phoneConversationError,
      } = await admin
        .from("whatsapp_conversations")
        .select(`
          id,
          store_id,
          order_id,
          phone,
          customer_name
        `)
        .eq("store_id", automationRun.store_id)
        .eq("phone", recipientPhone)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (phoneConversationError) {
        console.error(
          "Delivery No Answer phone conversation lookup failed:",
          phoneConversationError
        );

        await failRun(
          admin,
          automationRun.id,
          nextAttemptCount,
          "conversation_lookup_failed"
        );

        return {
          state: "failed",
          reason: "conversation_lookup_failed",
        };
      }

      conversation = phoneConversation;
    }

    const now = new Date().toISOString();

    if (!conversation) {
      const {
        data: createdConversation,
        error: createConversationError,
      } = await admin
        .from("whatsapp_conversations")
        .insert({
          store_id: automationRun.store_id,
          order_id: automationRun.order_id,
          phone: recipientPhone,
          customer_name: customerName,
          last_message_at: now,
          unread_count: 0,
          created_at: now,
          updated_at: now,
        })
        .select(`
          id,
          store_id,
          order_id,
          phone,
          customer_name
        `)
        .single();

      if (createConversationError || !createdConversation) {
        console.error(
          "Delivery No Answer conversation creation failed:",
          createConversationError
        );

        await failRun(
          admin,
          automationRun.id,
          nextAttemptCount,
          "conversation_creation_failed"
        );

        return {
          state: "failed",
          reason: "conversation_creation_failed",
        };
      }

      conversation = createdConversation;
    }

    // =====================================================
    // 9. LINK CONVERSATION
    // =====================================================

    const { error: runConversationError } = await admin
      .from("whatsapp_shipping_automation_runs")
      .update({
        conversation_id: conversation.id,
        updated_at: now,
      })
      .eq("id", automationRun.id);

    if (runConversationError) {
      console.error(
        "Delivery No Answer run conversation update failed:",
        runConversationError
      );
    }

    const { error: conversationLinkError } = await admin
      .from("whatsapp_conversations")
      .update({
        order_id: automationRun.order_id,
        customer_name: conversation.customer_name || customerName,
        updated_at: now,
      })
      .eq("id", conversation.id);

    if (conversationLinkError) {
      console.error(
        "Delivery No Answer conversation link update failed:",
        conversationLinkError
      );
    }

    // =====================================================
    // 10. CHOOSE TEMPLATE
    // =====================================================

    let templateName: string;
    let bodyParameters: BodyParameter[];
    let imageUrl: string | null = null;
    let diagnostic: string | null = null;

    if (!hasCourierInfo) {
      templateName = TEMPLATE_FALLBACK;
      bodyParameters = buildFallbackParameters({
        customerName,
        productName,
      });
      diagnostic = "fallback_missing_courier_info";
    } else if (automationKey === "delivery_no_answer_initial") {
      templateName = TEMPLATE_INITIAL;
      bodyParameters = buildCourierParameters({
        customerName,
        productName,
        courierName,
        courierPhone,
      });
    } else {
      const imageResult = await findProductImage(admin, {
        storeId: Number(automationRun.store_id),
        productName,
        color: productColor,
        colorKey: productColorKey,
        size: productSize,
      });

      imageUrl = imageResult.imageUrl;
      diagnostic = imageResult.diagnostic;

      templateName = imageUrl
        ? TEMPLATE_FOLLOWUP_IMAGE
        : TEMPLATE_FOLLOWUP_TEXT;

      bodyParameters = buildCourierParameters({
        customerName,
        productName,
        courierName,
        courierPhone,
      });
    }

    // =====================================================
    // 11. SEND HELPER
    // =====================================================

    const url =
      `https://graph.facebook.com/${GRAPH_API_VERSION}` +
      `/${phoneNumberId}/messages`;

    async function sendTemplate(params: {
      templateName: string;
      bodyParameters: BodyParameter[];
      imageUrl?: string | null;
    }): Promise<
      | {
          kind: "success";
          whatsappMessageId: string | null;
        }
      | {
          kind: "http_error";
          status: number;
          message: string;
        }
      | {
          kind: "uncertain";
          message: string;
        }
    > {
      const components: any[] = [];

      if (params.imageUrl) {
        components.push({
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                link: params.imageUrl,
              },
            },
          ],
        });
      }

      components.push({
        type: "body",
        parameters: params.bodyParameters,
      });

      const payload = {
        messaging_product: "whatsapp",
        to: recipientPhone,
        type: "template",
        template: {
          name: params.templateName,
          language: {
            code: TEMPLATE_LANGUAGE,
          },
          components,
        },
      };

      let metaResponse: Response;

      try {
        metaResponse = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          cache: "no-store",
        });
      } catch (fetchError) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : String(fetchError);

        console.error(
          "Delivery No Answer Meta network error:",
          fetchError
        );

        return {
          kind: "uncertain",
          message,
        };
      }

      const responseText = await metaResponse.text();
      let metaData: any;

      try {
        metaData = JSON.parse(responseText);
      } catch {
        metaData = {
          raw_response: responseText,
        };
      }

      console.log(
        "===== DELIVERY NO ANSWER META RESPONSE =====",
        {
          templateName: params.templateName,
          status: metaResponse.status,
          response: metaData,
        }
      );

      if (!metaResponse.ok) {
        const message = metaData?.error?.message
          ? String(metaData.error.message)
          : "unknown_meta_error";

        return {
          kind: "http_error",
          status: metaResponse.status,
          message,
        };
      }

      const whatsappMessageId = Array.isArray(metaData?.messages)
        ? metaData.messages?.[0]?.id || null
        : null;

      return {
        kind: "success",
        whatsappMessageId,
      };
    }

    // =====================================================
    // 12. SEND SELECTED TEMPLATE
    // =====================================================

    let sendResult = await sendTemplate({
      templateName,
      bodyParameters,
      imageUrl:
        templateName === TEMPLATE_FOLLOWUP_IMAGE
          ? imageUrl
          : null,
    });

    // =====================================================
    // 13. IMAGE TEMPLATE DETERMINISTIC FAILURE -> TEXT
    // =====================================================
    //
    // If Meta explicitly rejects the image-template request,
    // it is safe to try the approved text fallback because
    // the first request was not accepted.
    //
    // If the network result is uncertain, NEVER fallback:
    // Meta may already have accepted the image message.
    // =====================================================

    if (
      templateName === TEMPLATE_FOLLOWUP_IMAGE &&
      sendResult.kind === "http_error"
    ) {
      diagnostic =
        `fallback_image_template_http_${sendResult.status}:` +
        sendResult.message;

      templateName = TEMPLATE_FOLLOWUP_TEXT;
      imageUrl = null;

      sendResult = await sendTemplate({
        templateName,
        bodyParameters,
      });
    }

    // =====================================================
    // 14. UNCERTAIN NETWORK RESULT
    // =====================================================

    if (sendResult.kind === "uncertain") {
      await failRun(
        admin,
        automationRun.id,
        nextAttemptCount,
        `meta_send_uncertain:${sendResult.message}`
      );

      return {
        state: "failed",
        reason: "meta_send_uncertain",
      };
    }

    // =====================================================
    // 15. CLEAR META HTTP FAILURE
    // =====================================================

    if (sendResult.kind === "http_error") {
      const errorReason =
        `meta_http_${sendResult.status}:` +
        sendResult.message;

      await failRun(
        admin,
        automationRun.id,
        nextAttemptCount,
        errorReason
      );

      return {
        state: "failed",
        reason: "meta_send_failed",
      };
    }

    const whatsappMessageId = sendResult.whatsappMessageId;

    // =====================================================
    // 16. SAVE OUTGOING MESSAGE LOCALLY
    // =====================================================

    const templateBody = buildLocalTemplateBody({
      templateName,
      customerName,
      productName,
      courierName,
      courierPhone,
    });

    const finalImageUrl =
      templateName === TEMPLATE_FOLLOWUP_IMAGE
        ? imageUrl
        : null;

    const { data: savedMessage, error: saveMessageError } =
      await admin
        .from("whatsapp_messages")
        .insert({
          conversation_id: conversation.id,
          store_id: automationRun.store_id,
          whatsapp_message_id: whatsappMessageId,
          direction: "outgoing",
          message_type: "template",
          body: templateBody,
          media_id: null,
          media_url: finalImageUrl,
          media_mime_type: finalImageUrl ? "image/jpeg" : null,
          // Current WhatsApp inbox renders template product images
          // from caption when it contains an HTTP(S) URL.
          caption: finalImageUrl,
          status: "sent",
          created_at: now,
        })
        .select("id")
        .single();

    // =====================================================
    // 17. UPDATE CONVERSATION
    // =====================================================

    const { error: conversationUpdateError } = await admin
      .from("whatsapp_conversations")
      .update({
        order_id: automationRun.order_id,
        customer_name: conversation.customer_name || customerName,
        last_message_at: now,
        updated_at: now,
      })
      .eq("id", conversation.id);

    if (conversationUpdateError) {
      console.error(
        "Delivery No Answer conversation update failed:",
        conversationUpdateError
      );
    }

    // =====================================================
    // 18. META SUCCESS + LOCAL HISTORY FAILURE
    // =====================================================
    //
    // Meta already accepted the message, so the logical run
    // must be SENT even if local history saving fails.
    // Retrying here could duplicate the customer message.
    // =====================================================

    if (saveMessageError || !savedMessage) {
      console.error(
        "Delivery No Answer outgoing history save failed:",
        saveMessageError
      );

      await admin
        .from("whatsapp_shipping_automation_runs")
        .update({
          status: "sent",
          conversation_id: conversation.id,
          outgoing_message_id: null,
          attempt_count: nextAttemptCount,
          last_error: "message_sent_but_history_save_failed",
          sent_at: now,
          updated_at: now,
        })
        .eq("id", automationRun.id);

      return {
        state: "sent",
        run_id: automationRun.id,
        conversation_id: conversation.id,
        outgoing_message_id: null,
        whatsapp_message_id: whatsappMessageId,
        template_name: templateName,
      };
    }

    // =====================================================
    // 19. COMPLETE RUN
    // =====================================================

    const { error: completeRunError } = await admin
      .from("whatsapp_shipping_automation_runs")
      .update({
        status: "sent",
        conversation_id: conversation.id,
        outgoing_message_id: savedMessage.id,
        attempt_count: nextAttemptCount,
        // Keep a small diagnostic when a safe fallback was used.
        // This lets us inspect whether missing courier/image data
        // actually occurs in production without creating new columns.
        last_error: diagnostic
          ? diagnostic.slice(0, 1000)
          : null,
        sent_at: now,
        updated_at: now,
      })
      .eq("id", automationRun.id);

    if (completeRunError) {
      console.error(
        "Delivery No Answer run completion failed:",
        completeRunError
      );
    }

    return {
      state: "sent",
      run_id: automationRun.id,
      conversation_id: conversation.id,
      outgoing_message_id: savedMessage.id,
      whatsapp_message_id: whatsappMessageId,
      template_name: templateName,
    };
  } catch (error) {
    console.error(
      "Unexpected Delivery No Answer send error:",
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