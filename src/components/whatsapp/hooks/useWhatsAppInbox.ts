import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/src/lib/supabase";

export interface Conversation {
  id: number;
  phone: string;
  customer_name: string | null;
  order_id: number | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface WhatsAppMessage {
  id: number;
  conversation_id: number;
  whatsapp_message_id?: string | null;
  direction:
    | "incoming"
    | "outgoing";
  message_type: string;
  body: string | null;
  media_id: string | null;
  media_mime_type: string | null;
  caption: string | null;
  status: string | null;
  created_at: string;
}

const MESSAGE_PAGE_SIZE = 50;

export function useWhatsAppInbox() {
  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [messages, setMessages] =
    useState<WhatsAppMessage[]>([]);

  const [
    selectedConversationId,
    setSelectedConversationId,
  ] = useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loadingOlderMessages, setLoadingOlderMessages] =
    useState(false);

  const [hasMoreMessages, setHasMoreMessages] =
    useState(false);

  const selectedConversationIdRef =
    useRef<number | null>(null);

  const messagesLoadingRef =
    useRef<number | null>(null);

  // Number of newest records already loaded for the active conversation.
  // Kept separate from messages.length so Realtime inserts do not change
  // the pagination offset.
  const messageOffsetRef =
    useRef(0);

  const initialMessagesLoadedForRef =
    useRef<number | null>(null);

  const sortConversations = useCallback(
    (items: Conversation[]) => {
      return [...items].sort((a, b) => {
        const aTime =
          a.last_message_at
            ? new Date(
                a.last_message_at
              ).getTime()
            : 0;

        const bTime =
          b.last_message_at
            ? new Date(
                b.last_message_at
              ).getTime()
            : 0;

        return bTime - aTime;
      });
    },
    []
  );

  const loadInbox =
    useCallback(
      async (
        showLoading = true,
        conversationId: number | null = null
      ) => {
        try {
          if (showLoading) {
            setLoading(true);
          }

          const targetConversationId =
            conversationId ??
            selectedConversationIdRef.current;

          const params =
            new URLSearchParams();

          if (conversationId) {
            params.set(
              "conversation_id",
              String(targetConversationId)
            );

            params.set(
              "limit",
              String(MESSAGE_PAGE_SIZE)
            );
          }

          const response =
            await fetch(
              `/api/whatsapp/inbox${
                params.toString()
                  ? `?${params.toString()}`
                  : ""
              }`,
              {
                cache: "no-store",
              }
            );

          const result =
            await response.json();

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ||
                "Erreur chargement Inbox."
            );
          }

          setConversations(
            result.conversations || []
          );

          const firstConversationId =
            result
              .conversations?.[0]
              ?.id ??
            null;

          if (
            !conversationId &&
            result.messages_loaded_for ===
              firstConversationId
          ) {
            initialMessagesLoadedForRef.current =
              firstConversationId;
          }

          if (
            conversationId ||
            result.messages_loaded_for
          ) {
            const loadedMessages =
              result.messages || [];

            setMessages(
              loadedMessages
            );

            messageOffsetRef.current =
              loadedMessages.length;

            setHasMoreMessages(
              Boolean(
                result.has_more_messages
              )
            );
          }

          setSelectedConversationId(
            (current) =>
              current ??
              firstConversationId
          );
        } catch (error) {
          console.error(
            "Inbox loading error:",
            error
          );
        } finally {
          if (showLoading) {
            setLoading(false);
          }
        }
      },
      []
    );

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    selectedConversationIdRef.current =
      selectedConversationId;
  }, [selectedConversationId]);

  // Allow the topbar notification dropdown to open a conversation
  // immediately, even when we are already on /whatsapp.
  useEffect(() => {
    const handleOpenConversation = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<number>;

      const conversationId =
        Number(customEvent.detail);

      if (
        !Number.isInteger(
          conversationId
        )
      ) {
        return;
      }

      setSelectedConversationId(
        conversationId
      );
    };

    window.addEventListener(
      "whatsapp:open-conversation",
      handleOpenConversation
    );

    return () => {
      window.removeEventListener(
        "whatsapp:open-conversation",
        handleOpenConversation
      );
    };
  }, []);

  const loadConversationMessages =
    useCallback(
      async (
        conversationId: number
      ) => {
        if (
          messagesLoadingRef.current ===
          conversationId
        ) {
          return;
        }

        messagesLoadingRef.current =
          conversationId;

        setMessages([]);
        setHasMoreMessages(false);
        messageOffsetRef.current = 0;

        try {
          const params =
            new URLSearchParams();

          params.set(
            "conversation_id",
            String(conversationId)
          );

          params.set(
            "limit",
            String(MESSAGE_PAGE_SIZE)
          );

          params.set(
            "offset",
            "0"
          );

          const response =
            await fetch(
              `/api/whatsapp/inbox?${params.toString()}`,
              {
                cache: "no-store",
              }
            );

          const result =
            await response.json();

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ||
                "Erreur chargement des messages."
            );
          }

          if (
            selectedConversationIdRef.current ===
            conversationId
          ) {
            const loadedMessages =
              result.messages || [];

            setMessages(
              loadedMessages
            );

            messageOffsetRef.current =
              loadedMessages.length;

            setHasMoreMessages(
              Boolean(
                result.has_more_messages
              )
            );
          }
        } catch (error) {
          console.error(
            "Conversation messages loading error:",
            error
          );
        } finally {
          if (
            messagesLoadingRef.current ===
            conversationId
          ) {
            messagesLoadingRef.current =
              null;
          }
        }
      },
      []
    );

  const loadOlderMessages =
    useCallback(
      async (
        conversationId: number
      ) => {
        if (
          loadingOlderMessages ||
          !hasMoreMessages ||
          messagesLoadingRef.current ===
            conversationId
        ) {
          return;
        }

        messagesLoadingRef.current =
          conversationId;

        setLoadingOlderMessages(true);

        try {
          const offset =
            messageOffsetRef.current;

          const params =
            new URLSearchParams();

          params.set(
            "conversation_id",
            String(conversationId)
          );

          params.set(
            "limit",
            String(MESSAGE_PAGE_SIZE)
          );

          params.set(
            "offset",
            String(offset)
          );

          const response =
            await fetch(
              `/api/whatsapp/inbox?${params.toString()}`,
              {
                cache: "no-store",
              }
            );

          const result =
            await response.json();

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ||
                "Erreur chargement des anciens messages."
            );
          }

          const olderMessages =
            result.messages || [];

          if (
            selectedConversationIdRef.current ===
            conversationId
          ) {
            setMessages(
              (current) => {
                const existingIds =
                  new Set(
                    current.map(
                      (message) =>
                        message.id
                    )
                  );

                const uniqueOlder =
                  olderMessages.filter(
                    (message: WhatsAppMessage) =>
                      !existingIds.has(
                        message.id
                      )
                  );

                messageOffsetRef.current +=
                  olderMessages.length;

                return [
                  ...uniqueOlder,
                  ...current,
                ];
              }
            );

            setHasMoreMessages(
              Boolean(
                result.has_more_messages
              )
            );
          }
        } catch (error) {
          console.error(
            "Older messages loading error:",
            error
          );
        } finally {
          messagesLoadingRef.current =
            null;

          setLoadingOlderMessages(false);
        }
      },
      [
        hasMoreMessages,
        loadingOlderMessages,
      ]
    );

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    // The initial Inbox request already loaded the first chat.
    if (
      initialMessagesLoadedForRef.current ===
      selectedConversationId
    ) {
      initialMessagesLoadedForRef.current =
        null;
      return;
    }

    void loadConversationMessages(
      selectedConversationId
    );
  }, [
    selectedConversationId,
    loadConversationMessages,
  ]);

  const markConversationAsRead =
    useCallback(
      async (
        conversationId: number
      ) => {
        try {
          const response =
            await fetch(
              "/api/whatsapp/inbox/mark-read",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  conversation_id:
                    conversationId,
                }),
              }
            );

          const result =
            await response.json();

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ||
                "Impossible de marquer la conversation comme lue."
            );
          }

          setConversations(
            (current) =>
              current.map(
                (conversation) =>
                  conversation.id ===
                  conversationId
                    ? {
                        ...conversation,
                        unread_count: 0,
                      }
                    : conversation
              )
          );
        } catch (error) {
          console.error(
            "Mark conversation as read error:",
            error
          );
        }
      },
      []
    );

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const conversation =
      conversations.find(
        (item) =>
          item.id ===
          selectedConversationId
      );

    if (conversation?.unread_count) {
      void markConversationAsRead(
        selectedConversationId
      );
    }
  }, [
    selectedConversationId,
    conversations,
    markConversationAsRead,
  ]);

  // Supports opening a conversation directly
  // from a Browser Notification.
  useEffect(() => {
    const value =
      new URLSearchParams(
        window.location.search
      ).get("conversation");

    if (!value) return;

    const conversationId =
      Number(value);

    if (
      !Number.isFinite(
        conversationId
      )
    ) {
      return;
    }

    setSelectedConversationId(
      conversationId
    );

    window.history.replaceState(
      {},
      "",
      "/whatsapp"
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    const applyRealtimeMessage =
      (payload: any) => {
        if (cancelled) return;

        const eventType =
          payload?.eventType;

        const row =
          payload?.new as
            | WhatsAppMessage
            | undefined;

        const oldRow =
          payload?.old as
            | WhatsAppMessage
            | undefined;

        if (!row && !oldRow) {
          return;
        }

        if (
          eventType === "INSERT" &&
          row
        ) {
          setMessages(
            (current) => {
              if (
                current.some(
                  (message) =>
                    message.id ===
                    row.id
                )
              ) {
                return current;
              }

              // Only add the Realtime message to
              // the currently open conversation.
              if (
                row.conversation_id !==
                selectedConversationIdRef.current
              ) {
                return current;
              }

              return [...current, row];
            }
          );

          const conversationId =
            row.conversation_id;

          const isOpenConversation =
            conversationId ===
            selectedConversationIdRef.current;

          setConversations(
            (current) => {
              const existing =
                current.find(
                  (conversation) =>
                    conversation.id ===
                    conversationId
                );

              if (existing) {
                return sortConversations(
                  current.map(
                    (conversation) =>
                      conversation.id ===
                      conversationId
                        ? {
                            ...conversation,
                            last_message_at:
                              row.created_at ||
                              conversation.last_message_at,
                            unread_count:
                              row.direction ===
                              "incoming"
                                ? isOpenConversation
                                  ? 0
                                  : conversation.unread_count +
                                    1
                                : conversation.unread_count,
                          }
                        : conversation
                  )
                );
              }

              return sortConversations(
                [
                  ...current,
                  {
                    id: conversationId,
                    phone: "",
                    customer_name:
                      null,
                    order_id: null,
                    last_message_at:
                      row.created_at ||
                      null,
                    unread_count:
                      row.direction ===
                        "incoming" &&
                      !isOpenConversation
                        ? 1
                        : 0,
                  },
                ]
              );
            }
          );

          if (
            row.direction ===
              "incoming" &&
            isOpenConversation
          ) {
            void markConversationAsRead(
              conversationId
            );
          }

          return;
        }

        if (
          eventType === "UPDATE" &&
          row
        ) {
          setMessages(
            (current) =>
              current.map(
                (message) =>
                  message.id === row.id
                    ? {
                        ...message,
                        ...row,
                      }
                    : message
              )
          );

          return;
        }

        if (
          eventType === "DELETE" &&
          oldRow
        ) {
          setMessages(
            (current) =>
              current.filter(
                (message) =>
                  message.id !==
                  oldRow.id
              )
          );
        }
      };

    const applyRealtimeConversation =
      (payload: any) => {
        if (cancelled) return;

        const eventType =
          payload?.eventType;

        const row =
          payload?.new as
            | Conversation
            | undefined;

        const oldRow =
          payload?.old as
            | Conversation
            | undefined;

        if (
          eventType === "INSERT" &&
          row
        ) {
          setConversations(
            (current) => {
              const exists =
                current.some(
                  (conversation) =>
                    conversation.id ===
                    row.id
                );

              if (exists) {
                return sortConversations(
                  current.map(
                    (conversation) =>
                      conversation.id ===
                      row.id
                        ? {
                            ...conversation,
                            ...row,
                          }
                        : conversation
                  )
                );
              }

              return sortConversations([
                ...current,
                row,
              ]);
            }
          );

          return;
        }

        if (
          eventType === "UPDATE" &&
          row
        ) {
          setConversations(
            (current) => {
              const exists =
                current.some(
                  (conversation) =>
                    conversation.id ===
                    row.id
                );

              if (!exists) {
                return sortConversations([
                  ...current,
                  row,
                ]);
              }

              return sortConversations(
                current.map(
                  (conversation) =>
                    conversation.id ===
                    row.id
                      ? {
                          ...conversation,
                          ...row,
                        }
                      : conversation
                )
              );
            }
          );

          return;
        }

        if (
          eventType === "DELETE" &&
          oldRow
        ) {
          setConversations(
            (current) =>
              current.filter(
                (conversation) =>
                  conversation.id !==
                  oldRow.id
              )
          );

          setMessages(
            (current) =>
              current.filter(
                (message) =>
                  message.conversation_id !==
                  oldRow.id
              )
          );

          if (
            selectedConversationIdRef.current ===
            oldRow.id
          ) {
            setSelectedConversationId(
              null
            );
          }
        }
      };

    const setupRealtime = async () => {
      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user ||
        cancelled
      ) {
        if (userError) {
          console.error(
            "WhatsApp Realtime auth error:",
            userError
          );
        }

        return undefined;
      }

      const {
        data: store,
        error: storeError,
      } =
        await supabase
          .from("stores")
          .select("id")
          .eq(
            "owner_id",
            user.id
          )
          .maybeSingle();

      if (
        storeError ||
        !store ||
        cancelled
      ) {
        if (storeError) {
          console.error(
            "WhatsApp Realtime store error:",
            storeError
          );
        }

        return undefined;
      }

      const channel = supabase
        .channel(
          `whatsapp-inbox-${store.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "whatsapp_messages",
            filter:
              `store_id=eq.${store.id}`,
          },
          (payload) => {
            applyRealtimeMessage(
              payload
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "whatsapp_conversations",
            filter:
              `store_id=eq.${store.id}`,
          },
          (payload) => {
            applyRealtimeConversation(
              payload
            );
          }
        )
        .subscribe(
          (status) => {
            if (
              status ===
              "SUBSCRIBED"
            ) {
              console.log(
                "WhatsApp Realtime connected."
              );
            } else if (
              status ===
              "CHANNEL_ERROR"
            ) {
              console.error(
                "WhatsApp Realtime channel error."
              );
            } else if (
              status ===
              "TIMED_OUT"
            ) {
              console.error(
                "WhatsApp Realtime connection timed out."
              );
            }
          }
        );

      return () => {
        void supabase.removeChannel(
          channel
        );
      };
    };

    let cleanup:
      | (() => void)
      | undefined;

    void setupRealtime().then(
      (cleanupFn) => {
        if (cancelled) {
          cleanupFn?.();
        } else {
          cleanup =
            cleanupFn;
        }
      }
    );

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [
    markConversationAsRead,
    sortConversations,
  ]);

  const selectedConversation =
    useMemo(
      () =>
        conversations.find(
          (conversation) =>
            conversation.id ===
            selectedConversationId
        ) || null,
      [
        conversations,
        selectedConversationId,
      ]
    );

  const selectedMessages =
    useMemo(
      () =>
        messages.filter(
          (message) =>
            message.conversation_id ===
            selectedConversationId
        ),
      [
        messages,
        selectedConversationId,
      ]
    );

  const lastMessageByConversation =
    useMemo(() => {
      const map =
        new Map<
          number,
          WhatsAppMessage
        >();

      for (const message of messages) {
        const current =
          map.get(
            message.conversation_id
          );

        if (
          !current ||
          new Date(
            message.created_at
          ).getTime() >
            new Date(
              current.created_at
            ).getTime()
        ) {
          map.set(
            message.conversation_id,
            message
          );
        }
      }

      return map;
    }, [messages]);

  return {
    conversations,
    messages,
    selectedConversationId,
    setSelectedConversationId,
    selectedConversation,
    selectedMessages,
    lastMessageByConversation,
    loading,
    loadingOlderMessages,
    hasMoreMessages,
    loadInbox,
    loadOlderMessages,
  };
}