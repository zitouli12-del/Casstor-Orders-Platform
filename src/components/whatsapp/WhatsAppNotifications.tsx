"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Image as ImageIcon,
  Mic,
  MessageCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

interface Conversation {
  id: number;
  phone: string;
  customer_name: string | null;
  last_message_at: string | null;
  unread_count: number;
}

interface WhatsAppMessage {
  id: number;
  conversation_id: number;
  direction: "incoming" | "outgoing";
  message_type: string;
  body: string | null;
  caption: string | null;
  created_at: string;
}

function formatTime(value: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPreview(message?: WhatsAppMessage) {
  if (!message) return "Nouveau message";

  if (message.body?.trim()) return message.body.trim();
  if (message.caption?.trim()) return message.caption.trim();

  if (message.message_type === "image") return "[Image]";
  if (message.message_type === "audio") return "[Audio]";
  if (message.message_type === "video") return "[Vidéo]";
  if (message.message_type === "document") return "[Document]";

  return "Nouveau message";
}

function playNotificationSound(
  audioContextRef: { current: AudioContext | null }
) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

    if (!AudioContextClass) return;

    let audioContext = audioContextRef.current;

    if (!audioContext) {
      audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
    }

    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    const now = audioContext.currentTime;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1050, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      780,
      now + 0.28
    );

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.55, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.33);
  } catch (error) {
    console.error("Notification sound error:", error);
  }
}

export default function WhatsAppNotifications() {
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const refreshTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSoundAtRef = useRef(0);

  // Ref حتى يبقى Realtime عندو آخر conversations
  // بلا ما نعاودو نركبو channel كل مرة كتتبدل state.
  const conversationsRef = useRef<Conversation[]>([]);

  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/whatsapp/inbox", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Erreur notifications WhatsApp."
        );
      }

      const nextConversations = result.conversations || [];
      const nextMessages = result.messages || [];

      conversationsRef.current = nextConversations;
      setConversations(nextConversations);
      setMessages(nextMessages);
    } catch (error) {
      console.error("WhatsApp notifications error:", error);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  // =====================================================
  // BROWSER NOTIFICATION PERMISSION
  // =====================================================

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window)
    ) {
      return;
    }

    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  // =====================================================
  // AUDIO UNLOCK
  // =====================================================

  useEffect(() => {
    const unlockAudio = () => {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }).webkitAudioContext;

        if (!AudioContextClass) return;

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextClass();
        }

        if (audioContextRef.current.state === "suspended") {
          void audioContextRef.current.resume();
        }
      } catch (error) {
        console.error("Audio unlock error:", error);
      }
    };

    document.addEventListener("pointerdown", unlockAudio, {
      once: true,
    });

    return () => {
      document.removeEventListener("pointerdown", unlockAudio);
    };
  }, []);

  // =====================================================
  // CLOSE NOTIFICATION PANEL OUTSIDE CLICK
  // =====================================================

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // =====================================================
  // MARK CONVERSATION AS READ
  // =====================================================

  const markConversationAsRead = useCallback(
    async (conversationId: number) => {
      // أولاً نحدّث الواجهة مباشرة.
      conversationsRef.current =
        conversationsRef.current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                unread_count: 0,
              }
            : conversation
        );

      setConversations(conversationsRef.current);

      try {
        const response = await fetch(
          "/api/whatsapp/inbox/mark-read",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              conversation_id: conversationId,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Impossible de marquer la conversation comme lue."
          );
        }
      } catch (error) {
        console.error(
          "Mark conversation as read error:",
          error
        );

        // إذا فشل update في السيرفر، نرجعو البيانات الحقيقية.
        void loadNotifications();
      }
    },
    [loadNotifications]
  );

  // =====================================================
  // REALTIME
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    const scheduleRefresh = () => {
      if (cancelled || refreshTimerRef.current) return;

      refreshTimerRef.current = setTimeout(() => {
        refreshTimerRef.current = null;

        if (!cancelled) {
          void loadNotifications();
        }
      }, 150);
    };

    const showBrowserNotification = (
      message: WhatsAppMessage
    ) => {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      const conversation =
        conversationsRef.current.find(
          (item) => item.id === message.conversation_id
        );

      const title =
        conversation?.customer_name ||
        conversation?.phone ||
        "WhatsApp";

      const notification = new Notification(title, {
        body: getPreview(message),
        tag: `whatsapp-conversation-${message.conversation_id}`,
        icon: "/favicon.ico",
      });

      notification.onclick = () => {
        window.focus();

        // Mark as read immediately.
        void markConversationAsRead(
          message.conversation_id
        );

        window.dispatchEvent(
          new CustomEvent(
            "whatsapp:open-conversation",
            {
              detail:
                message.conversation_id,
            }
          )
        );

        router.push(
          `/whatsapp?conversation=${message.conversation_id}`
        );

        notification.close();
      };
    };

    const handleRealtimeMessage = (payload: any) => {
      if (cancelled) return;

      const newMessage = payload?.new;

      if (
        payload?.eventType === "INSERT" &&
        newMessage?.direction === "incoming"
      ) {
        const now = Date.now();

        if (now - lastSoundAtRef.current > 400) {
          lastSoundAtRef.current = now;
          playNotificationSound(audioContextRef);
        }

        showBrowserNotification(
          newMessage as WhatsAppMessage
        );
      }

      scheduleRefresh();
    };

    const setupRealtime = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user || cancelled) {
        if (userError) {
          console.error(
            "WhatsApp notification auth error:",
            userError
          );
        }

        return undefined;
      }

      const { data: store, error: storeError } =
        await supabase
          .from("stores")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

      if (storeError || !store || cancelled) {
        if (storeError) {
          console.error(
            "WhatsApp notification store error:",
            storeError
          );
        }

        return undefined;
      }

      const channel = supabase
        .channel(`whatsapp-notifications-${store.id}`)
.on(
  "postgres_changes",
  {
    event: "INSERT",
    schema: "public",
    table: "whatsapp_messages",
    filter: `store_id=eq.${store.id}`,
  },
  handleRealtimeMessage
)
.on(
  "postgres_changes",
  {
    event: "UPDATE",
    schema: "public",
    table: "whatsapp_conversations",
    filter: `store_id=eq.${store.id}`,
  },
  scheduleRefresh
)
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log(
              "WhatsApp notifications Realtime connected."
            );
          }
        });

      return () => {
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }

        void supabase.removeChannel(channel);
      };
    };

    let cleanup: (() => void) | undefined;

    void setupRealtime().then((cleanupFn) => {
      if (cancelled) {
        cleanupFn?.();
      } else {
        cleanup = cleanupFn;
      }
    });

    return () => {
      cancelled = true;

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      cleanup?.();
    };
  }, [loadNotifications, markConversationAsRead, router]);

  // =====================================================
  // UNREAD DATA
  // =====================================================

  const unreadConversations = useMemo(
    () =>
      conversations
        .filter(
          (conversation) => conversation.unread_count > 0
        )
        .sort((a, b) => {
          const aTime = a.last_message_at
            ? new Date(a.last_message_at).getTime()
            : 0;

          const bTime = b.last_message_at
            ? new Date(b.last_message_at).getTime()
            : 0;

          return bTime - aTime;
        }),
    [conversations]
  );

  const totalUnread = useMemo(
    () =>
      unreadConversations.reduce(
        (total, conversation) =>
          total + conversation.unread_count,
        0
      ),
    [unreadConversations]
  );

  function getLastMessage(conversationId: number) {
    return messages
      .filter(
        (message) =>
          message.conversation_id === conversationId
      )
      .at(-1);
  }

  function openConversation(
    conversationId: number
  ) {
    setOpen(false);

    // Mark unread as read immediately.
    void markConversationAsRead(
      conversationId
    );

    // Explicitly tell the WhatsApp Inbox which chat to open.
    // This works even if we are already on /whatsapp.
    window.dispatchEvent(
      new CustomEvent(
        "whatsapp:open-conversation",
        {
          detail: conversationId,
        }
      )
    );

    router.push(
      `/whatsapp?conversation=${conversationId}`
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
      >
        <Bell size={18} />

        {totalUnread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Notifications
              </h3>

              <p className="mt-0.5 text-[11px] text-slate-400">
                {totalUnread > 0
                  ? `${totalUnread} message${
                      totalUnread > 1 ? "s" : ""
                    } non lu${
                      totalUnread > 1 ? "s" : ""
                    }`
                  : "Aucune nouvelle notification"}
              </p>
            </div>

            <MessageCircle
              size={18}
              className="text-green-600"
            />
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {unreadConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                  <Bell size={19} />
                </div>

                <p className="mt-3 text-sm font-medium text-slate-700">
                  Rien de nouveau
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Les nouveaux messages WhatsApp apparaîtront ici.
                </p>
              </div>
            ) : (
              unreadConversations.map((conversation) => {
                const lastMessage = getLastMessage(
                  conversation.id
                );

                const preview = getPreview(lastMessage);

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() =>
                      openConversation(conversation.id)
                    }
                    className="flex w-full items-start gap-3 border-b px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-sm font-semibold text-green-700">
                      {(conversation.customer_name || "?")
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">
                          {conversation.customer_name ||
                            conversation.phone}
                        </span>

                        <span className="shrink-0 text-[10px] text-slate-400">
                          {formatTime(
                            conversation.last_message_at
                          )}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        {lastMessage?.message_type ===
                          "image" && (
                          <ImageIcon
                            size={13}
                            className="shrink-0 text-slate-400"
                          />
                        )}

                        {lastMessage?.message_type ===
                          "audio" && (
                          <Mic
                            size={13}
                            className="shrink-0 text-slate-400"
                          />
                        )}

                        <p className="min-w-0 flex-1 truncate text-xs text-slate-500">
                          {preview}
                        </p>

                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-green-600 px-1.5 text-[10px] font-bold text-white">
                          {conversation.unread_count > 99
                            ? "99+"
                            : conversation.unread_count}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t bg-slate-50 px-4 py-2.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/whatsapp");
              }}
              className="w-full text-center text-xs font-medium text-green-700 transition hover:text-green-800"
            >
              Voir toutes les conversations
            </button>
          </div>
        </div>
      )}
    </div>
  );
}