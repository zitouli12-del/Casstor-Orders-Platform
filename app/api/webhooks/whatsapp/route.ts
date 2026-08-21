import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/src/lib/server";

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

type WhatsAppMessage = {
  id: string;
  from: string;
  timestamp?: string;
  type: string;
  text?: {
    body?: string;
  };
  image?: {
    caption?: string;
  };
  video?: {
    caption?: string;
  };
  document?: {
    caption?: string;
    filename?: string;
  };
  audio?: {
    id?: string;
  };
  sticker?: {
    id?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    name?: string;
    address?: string;
  };
  contacts?: unknown[];
};

type WhatsAppStatus = {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp?: string;
  recipient_id?: string;
  errors?: Array<{
    code?: number;
    title?: string;
    message?: string;
    error_data?: {
      details?: string;
    };
  }>;
};

function getMessageBody(message: WhatsAppMessage): string | null {
  switch (message.type) {
    case "text":
      return message.text?.body || null;

    case "image":
      return message.image?.caption || "[Image]";

    case "video":
      return message.video?.caption || "[Video]";

    case "audio":
      return "[Audio]";

    case "document":
      return message.document?.caption
        ? message.document.caption
        : message.document?.filename
          ? `[Document] ${message.document.filename}`
          : "[Document]";

    case "sticker":
      return "[Sticker]";

    case "location":
      if (message.location) {
        const name = message.location.name || "";
        const address = message.location.address || "";

        if (name || address) {
          return `[Location] ${name} ${address}`.trim();
        }

        return "[Location]";
      }

      return "[Location]";

    case "contacts":
      return "[Contact]";

    default:
      return `[${message.type}]`;
  }
}

function getMessageCreatedAt(timestamp?: string) {
  if (!timestamp) {
    return new Date().toISOString();
  }

  const timestampNumber = Number(timestamp);

  if (!Number.isFinite(timestampNumber)) {
    return new Date().toISOString();
  }

  return new Date(timestampNumber * 1000).toISOString();
}

// GET = Meta تستعمله للتحقق من الـ Webhook
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log("===== WHATSAPP WEBHOOK VERIFICATION =====");
  console.log("Mode:", mode);
  console.log("Challenge:", challenge);

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WhatsApp Webhook verified successfully");

    return new NextResponse(challenge || "", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  console.error("WhatsApp Webhook verification failed");

  return NextResponse.json(
    {
      success: false,
      message: "Invalid verify token",
    },
    { status: 403 }
  );
}

// POST = Meta غادي تبعث هنا messages/status updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("===== WHATSAPP WEBHOOK RECEIVED =====");

    const supabase = await getServerSupabase();

    if (body?.object !== "whatsapp_business_account") {
      console.warn("Ignoring non-WhatsApp webhook");

      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }

    const entries = Array.isArray(body.entry) ? body.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes)
        ? entry.changes
        : [];

      for (const change of changes) {
        if (change?.field !== "messages") {
          continue;
        }

        const value = change?.value;

        if (!value) {
          continue;
        }

        const metadata = value.metadata;

        const phoneNumberId = metadata?.phone_number_id;

        if (!phoneNumberId) {
          console.error(
            "WhatsApp webhook: phone_number_id missing"
          );
          continue;
        }

        console.log(
          "Phone Number ID:",
          phoneNumberId
        );

        // =====================================================
        // 1. FIND WHATSAPP CONNECTION
        // =====================================================

        const { data: connection, error: connectionError } =
          await supabase
            .from("whatsapp_connections")
            .select("id, store_id, phone_number, phone_number_id")
            .eq("phone_number_id", phoneNumberId)
            .eq("is_active", true)
            .maybeSingle();

        if (connectionError) {
          console.error(
            "WhatsApp connection lookup error:",
            connectionError
          );

          continue;
        }

        if (!connection) {
          console.error(
            "No active WhatsApp connection found for phone_number_id:",
            phoneNumberId
          );

          continue;
        }

        const storeId = connection.store_id;

        // =====================================================
        // 2. INCOMING MESSAGES
        // =====================================================

        const messages: WhatsAppMessage[] = Array.isArray(
          value.messages
        )
          ? value.messages
          : [];

        const contacts = Array.isArray(value.contacts)
          ? value.contacts
          : [];

        for (const message of messages) {
          if (!message?.id || !message?.from) {
            continue;
          }

          const phone = message.from;

          // ---------------------------------------------------
          // Customer name
          // ---------------------------------------------------

          let customerName: string | null = null;

          const contact = contacts.find(
            (item: any) =>
              item?.wa_id === phone
          );

          if (contact?.profile?.name) {
            customerName = contact.profile.name;
          }

          const createdAt = getMessageCreatedAt(
            message.timestamp
          );

          const messageBody = getMessageBody(message);

          console.log("===== INCOMING WHATSAPP MESSAGE =====");
          console.log("Store ID:", storeId);
          console.log("Phone:", phone);
          console.log("Message ID:", message.id);
          console.log("Type:", message.type);

          // ===================================================
          // 3. FIND EXISTING CONVERSATION
          // ===================================================

          let conversation = null;

          const { data: existingConversation, error: conversationFindError } =
            await supabase
              .from("whatsapp_conversations")
              .select(
                "id, store_id, order_id, phone, customer_name, unread_count"
              )
              .eq("store_id", storeId)
              .eq("phone", phone)
              .maybeSingle();

          if (conversationFindError) {
            console.error(
              "Conversation lookup error:",
              conversationFindError
            );

            continue;
          }

          conversation = existingConversation;

          // ===================================================
          // 4. CREATE CONVERSATION IF NOT EXISTS
          // ===================================================

          if (!conversation) {
            const { data: newConversation, error: createError } =
              await supabase
                .from("whatsapp_conversations")
                .insert({
                  store_id: storeId,
                  phone,
                  customer_name: customerName,
                  last_message_at: createdAt,
                  unread_count: 1,
                  created_at: createdAt,
                  updated_at: new Date().toISOString(),
                })
                .select(
                  "id, store_id, order_id, phone, customer_name, unread_count"
                )
                .single();

            if (createError) {
              console.error(
                "Conversation creation error:",
                createError
              );

              continue;
            }

            conversation = newConversation;

            console.log(
              "New WhatsApp conversation created:",
              conversation.id
            );
          } else {
            // =================================================
            // 5. UPDATE EXISTING CONVERSATION
            // =================================================

            const currentUnread =
              Number(conversation.unread_count || 0);

            const updateData: Record<string, any> = {
              last_message_at: createdAt,
              unread_count: currentUnread + 1,
              updated_at: new Date().toISOString(),
            };

            if (
              customerName &&
              !conversation.customer_name
            ) {
              updateData.customer_name = customerName;
            }

            const { error: updateConversationError } =
              await supabase
                .from("whatsapp_conversations")
                .update(updateData)
                .eq("id", conversation.id);

            if (updateConversationError) {
              console.error(
                "Conversation update error:",
                updateConversationError
              );

              continue;
            }
          }

          // ===================================================
          // 6. PREVENT DUPLICATE MESSAGE
          // ===================================================

          const { data: existingMessage, error: messageFindError } =
            await supabase
              .from("whatsapp_messages")
              .select("id")
              .eq(
                "whatsapp_message_id",
                message.id
              )
              .maybeSingle();

          if (messageFindError) {
            console.error(
              "Message duplicate check error:",
              messageFindError
            );

            continue;
          }

          if (existingMessage) {
            console.log(
              "Message already exists:",
              message.id
            );

            continue;
          }

          // ===================================================
          // 7. SAVE MESSAGE
          // ===================================================

          const { error: insertMessageError } =
            await supabase
              .from("whatsapp_messages")
              .insert({
                conversation_id: conversation.id,
                store_id: storeId,
                whatsapp_message_id: message.id,
                direction: "incoming",
                message_type: message.type,
                body: messageBody,
                status: "received",
                created_at: createdAt,
              });

          if (insertMessageError) {
            console.error(
              "WhatsApp message insert error:",
              insertMessageError
            );

            continue;
          }

          console.log(
            "WhatsApp message saved:",
            message.id
          );
        }

        // =====================================================
        // 8. MESSAGE STATUS UPDATES
        // =====================================================

        const statuses: WhatsAppStatus[] = Array.isArray(
          value.statuses
        )
          ? value.statuses
          : [];

        for (const status of statuses) {
          if (!status?.id || !status?.status) {
            continue;
          }

          console.log("===== WHATSAPP MESSAGE STATUS =====");
          console.log("Message ID:", status.id);
          console.log("Status:", status.status);

          const { data: existingMessage, error: statusFindError } =
            await supabase
              .from("whatsapp_messages")
              .select("id, status")
              .eq(
                "whatsapp_message_id",
                status.id
              )
              .maybeSingle();

          if (statusFindError) {
            console.error(
              "Status message lookup error:",
              statusFindError
            );

            continue;
          }

          if (!existingMessage) {
            console.warn(
              "Status received for unknown message:",
              status.id
            );

            continue;
          }

          const { error: updateStatusError } =
            await supabase
              .from("whatsapp_messages")
              .update({
                status: status.status,
              })
              .eq("id", existingMessage.id);

          if (updateStatusError) {
            console.error(
              "Message status update error:",
              updateStatusError
            );

            continue;
          }

          console.log(
            "Message status updated:",
            status.id,
            "→",
            status.status
          );
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "WhatsApp Webhook error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Invalid webhook payload",
      },
      { status: 400 }
    );
  }
}