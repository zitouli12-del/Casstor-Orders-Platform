import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const VERIFY_TOKEN =
  process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

type WhatsAppMessage = {
  id: string;
  from: string;
  timestamp?: string;
  type: string;

  text?: {
    body?: string;
  };

  image?: {
    id?: string;
    mime_type?: string;
    caption?: string;
  };

  video?: {
    id?: string;
    mime_type?: string;
    caption?: string;
  };

  document?: {
    id?: string;
    mime_type?: string;
    caption?: string;
    filename?: string;
  };

  audio?: {
    id?: string;
    mime_type?: string;
    voice?: boolean;
  };

  sticker?: {
    id?: string;
    mime_type?: string;
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
  status:
    | "sent"
    | "delivered"
    | "read"
    | "failed";

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

function getSupabaseAdmin() {
  if (!SUPABASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing."
    );
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing."
    );
  }

  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function getMessageBody(
  message: WhatsAppMessage
): string | null {
  switch (message.type) {
    case "text":
      return message.text?.body || null;

    case "image":
      return (
        message.image?.caption ||
        "[Image]"
      );

    case "video":
      return (
        message.video?.caption ||
        "[Video]"
      );

    case "audio":
      return "[Audio]";

    case "document":
      if (message.document?.caption) {
        return message.document.caption;
      }

      if (message.document?.filename) {
        return `[Document] ${message.document.filename}`;
      }

      return "[Document]";

    case "sticker":
      return "[Sticker]";

    case "location":
      if (message.location) {
        const name =
          message.location.name || "";

        const address =
          message.location.address || "";

        if (name || address) {
          return `[Location] ${name} ${address}`.trim();
        }
      }

      return "[Location]";

    case "contacts":
      return "[Contact]";

    default:
      return `[${message.type}]`;
  }
}

function getMessageMedia(
  message: WhatsAppMessage
) {
  switch (message.type) {
    case "image":
      return {
        mediaId:
          message.image?.id || null,

        mimeType:
          message.image?.mime_type || null,

        caption:
          message.image?.caption || null,
      };

    case "audio":
      return {
        mediaId:
          message.audio?.id || null,

        mimeType:
          message.audio?.mime_type || null,

        caption: null,
      };

    case "video":
      return {
        mediaId:
          message.video?.id || null,

        mimeType:
          message.video?.mime_type || null,

        caption:
          message.video?.caption || null,
      };

    case "document":
      return {
        mediaId:
          message.document?.id || null,

        mimeType:
          message.document?.mime_type || null,

        caption:
          message.document?.caption ||
          message.document?.filename ||
          null,
      };

    case "sticker":
      return {
        mediaId:
          message.sticker?.id || null,

        mimeType:
          message.sticker?.mime_type || null,

        caption: null,
      };

    default:
      return {
        mediaId: null,
        mimeType: null,
        caption: null,
      };
  }
}

function getMessageCreatedAt(
  timestamp?: string
) {
  if (!timestamp) {
    return new Date().toISOString();
  }

  const timestampNumber =
    Number(timestamp);

  if (!Number.isFinite(timestampNumber)) {
    return new Date().toISOString();
  }

  return new Date(
    timestampNumber * 1000
  ).toISOString();
}

// ============================================================
// GET
// Meta تستعمل GET للتحقق من Webhook
// ============================================================

export async function GET(
  request: NextRequest
) {
  const { searchParams } =
    new URL(request.url);

  const mode =
    searchParams.get("hub.mode");

  const token =
    searchParams.get(
      "hub.verify_token"
    );

  const challenge =
    searchParams.get(
      "hub.challenge"
    );

  console.log(
    "===== WHATSAPP WEBHOOK VERIFICATION ====="
  );

  console.log("Mode:", mode);

  console.log(
    "Challenge:",
    challenge
  );

  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN
  ) {
    console.log(
      "WhatsApp Webhook verified successfully"
    );

    return new NextResponse(
      challenge || "",
      {
        status: 200,
        headers: {
          "Content-Type":
            "text/plain",
        },
      }
    );
  }

  console.error(
    "WhatsApp Webhook verification failed"
  );

  return NextResponse.json(
    {
      success: false,
      message:
        "Invalid verify token",
    },
    {
      status: 403,
    }
  );
}

// ============================================================
// POST
// Meta تبعث هنا messages + status updates
// ============================================================

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    console.log(
      "===== WHATSAPP WEBHOOK RECEIVED ====="
    );

    console.log(
      JSON.stringify(
        body,
        null,
        2
      )
    );

    const supabase =
      getSupabaseAdmin();

    // ========================================================
    // 1. CHECK OBJECT
    // ========================================================

    if (
      body?.object !==
      "whatsapp_business_account"
    ) {
      console.warn(
        "Ignoring non-WhatsApp webhook"
      );

      return NextResponse.json(
        {
          success: true,
        },
        {
          status: 200,
        }
      );
    }

    const entries =
      Array.isArray(body.entry)
        ? body.entry
        : [];

    // ========================================================
    // 2. LOOP ENTRIES
    // ========================================================

    for (const entry of entries) {
      const changes =
        Array.isArray(
          entry?.changes
        )
          ? entry.changes
          : [];

      for (const change of changes) {
        if (
          change?.field !==
          "messages"
        ) {
          continue;
        }

        const value =
          change?.value;

        if (!value) {
          continue;
        }

        const metadata =
          value.metadata;

        const phoneNumberId =
          metadata?.phone_number_id;

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

        // ====================================================
        // 3. FIND WHATSAPP CONNECTION
        // ====================================================

        const {
          data: connection,
          error:
            connectionError,
        } = await supabase
          .from(
            "whatsapp_connections"
          )
          .select(
            "id, store_id, phone_number, phone_number_id, is_active, webhook_enabled"
          )
          .eq(
            "phone_number_id",
            phoneNumberId
          )
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
            "No WhatsApp connection found for phone_number_id:",
            phoneNumberId
          );

          continue;
        }

        if (
          connection.is_active !==
          true
        ) {
          console.error(
            "WhatsApp connection is not active:",
            phoneNumberId
          );

          continue;
        }

        console.log(
          "WhatsApp connection found:",
          connection.id
        );

        const storeId =
          connection.store_id;

        console.log(
          "WhatsApp Store ID:",
          storeId
        );

        // ====================================================
        // 4. INCOMING MESSAGES
        // ====================================================

        const messages:
          WhatsAppMessage[] =
            Array.isArray(
              value.messages
            )
              ? value.messages
              : [];

        const contacts =
          Array.isArray(
            value.contacts
          )
            ? value.contacts
            : [];

        for (const message of messages) {
          if (
            !message?.id ||
            !message?.from
          ) {
            continue;
          }

          const phone =
            message.from;

          // --------------------------------------------------
          // Customer name
          // --------------------------------------------------

          let customerName:
            | string
            | null = null;

          const contact =
            contacts.find(
              (item: any) =>
                item?.wa_id ===
                phone
            );

          if (
            contact?.profile?.name
          ) {
            customerName =
              contact.profile.name;
          }

          const createdAt =
            getMessageCreatedAt(
              message.timestamp
            );

          const messageBody =
            getMessageBody(
              message
            );

          const media =
            getMessageMedia(
              message
            );

          console.log(
            "===== INCOMING WHATSAPP MESSAGE ====="
          );

          console.log(
            "Store ID:",
            storeId
          );

          console.log(
            "Phone:",
            phone
          );

          console.log(
            "Customer:",
            customerName
          );

          console.log(
            "Message ID:",
            message.id
          );

          console.log(
            "Type:",
            message.type
          );

          console.log(
            "Body:",
            messageBody
          );

          console.log(
            "Media ID:",
            media.mediaId
          );

          console.log(
            "Media MIME:",
            media.mimeType
          );

          console.log(
            "Caption:",
            media.caption
          );

          // ==================================================
          // 5. CHECK DUPLICATE MESSAGE
          // ==================================================

          const {
            data:
              existingMessage,
            error:
              messageFindError,
          } = await supabase
            .from(
              "whatsapp_messages"
            )
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
              "Message already exists. Ignoring duplicate:",
              message.id
            );

            continue;
          }

          // ==================================================
          // 6. FIND EXISTING CONVERSATION
          // ==================================================

          const {
            data:
              existingConversation,
            error:
              conversationFindError,
          } = await supabase
            .from(
              "whatsapp_conversations"
            )
            .select(
              "id, store_id, order_id, phone, customer_name, unread_count"
            )
            .eq(
              "store_id",
              storeId
            )
            .eq(
              "phone",
              phone
            )
            .maybeSingle();

          if (conversationFindError) {
            console.error(
              "Conversation lookup error:",
              conversationFindError
            );

            continue;
          }

          let conversationId:
            number;

          let currentUnread = 0;

          // ==================================================
          // 7. CREATE CONVERSATION
          // ==================================================

          if (
            !existingConversation
          ) {
            console.log(
              "Creating new WhatsApp conversation..."
            );

            const {
              data:
                newConversation,
              error:
                createError,
            } = await supabase
              .from(
                "whatsapp_conversations"
              )
              .insert({
                store_id:
                  storeId,

                phone,

                customer_name:
                  customerName,

                last_message_at:
                  createdAt,

                unread_count: 0,

                created_at:
                  createdAt,

                updated_at:
                  new Date().toISOString(),
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

            conversationId =
              newConversation.id;

            console.log(
              "New WhatsApp conversation created:",
              conversationId
            );
          } else {
            conversationId =
              existingConversation.id;

            currentUnread =
              Number(
                existingConversation.unread_count ||
                  0
              );

            const updateConversationData:
              Record<
                string,
                any
              > = {
              last_message_at:
                createdAt,

              updated_at:
                new Date().toISOString(),
            };

            if (
              customerName &&
              !existingConversation.customer_name
            ) {
              updateConversationData.customer_name =
                customerName;
            }

            const {
              error:
                conversationUpdateError,
            } = await supabase
              .from(
                "whatsapp_conversations"
              )
              .update(
                updateConversationData
              )
              .eq(
                "id",
                conversationId
              );

            if (
              conversationUpdateError
            ) {
              console.error(
                "Conversation update error:",
                conversationUpdateError
              );

              continue;
            }
          }

          // ==================================================
          // 8. SAVE INCOMING MESSAGE
          // ==================================================

          const {
            error:
              insertMessageError,
          } = await supabase
            .from(
              "whatsapp_messages"
            )
            .insert({
              conversation_id:
                conversationId,

              store_id:
                storeId,

              whatsapp_message_id:
                message.id,

              direction:
                "incoming",

              message_type:
                message.type,

              body:
                messageBody,

              media_id:
                media.mediaId,

              media_mime_type:
                media.mimeType,

              caption:
                media.caption,

              status:
                "received",

              created_at:
                createdAt,
            });

          if (
            insertMessageError
          ) {
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

          // ==================================================
          // 9. UPDATE UNREAD COUNT
          // ==================================================

          const newUnreadCount =
            currentUnread + 1;

          const {
            error:
              unreadUpdateError,
          } = await supabase
            .from(
              "whatsapp_conversations"
            )
            .update({
              unread_count:
                newUnreadCount,

              last_message_at:
                createdAt,

              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              conversationId
            );

          if (
            unreadUpdateError
          ) {
            console.error(
              "Unread count update error:",
              unreadUpdateError
            );
          } else {
            console.log(
              "Unread count updated:",
              newUnreadCount
            );
          }

          console.log(
            "===== INCOMING MESSAGE PROCESSING COMPLETE ====="
          );
        }

        // ====================================================
        // 10. MESSAGE STATUS UPDATES
        // ====================================================

        const statuses:
          WhatsAppStatus[] =
            Array.isArray(
              value.statuses
            )
              ? value.statuses
              : [];

        for (const status of statuses) {
          if (
            !status?.id ||
            !status?.status
          ) {
            continue;
          }

          console.log(
            "===== WHATSAPP MESSAGE STATUS ====="
          );

          console.log(
            "Message ID:",
            status.id
          );

          console.log(
            "Status:",
            status.status
          );

          if (
            status.errors?.length
          ) {
            console.error(
              "WhatsApp status errors:",
              JSON.stringify(
                status.errors,
                null,
                2
              )
            );
          }

          const {
            data:
              existingMessage,
            error:
              statusFindError,
          } = await supabase
            .from(
              "whatsapp_messages"
            )
            .select(
              "id, status"
            )
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

          const {
            error:
              updateStatusError,
          } = await supabase
            .from(
              "whatsapp_messages"
            )
            .update({
              status:
                status.status,
            })
            .eq(
              "id",
              existingMessage.id
            );

          if (
            updateStatusError
          ) {
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
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "WhatsApp Webhook error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unexpected webhook error.",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}