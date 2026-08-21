"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MessageCircle,
  Search,
  Send,
} from "lucide-react";

interface Conversation {
  id: number;
  phone: string;
  customer_name: string | null;
  order_id: number | null;
  last_message_at: string | null;
  unread_count: number;
}

interface WhatsAppMessage {
  id: number;
  conversation_id: number;
  direction: "incoming" | "outgoing";
  message_type: string;
  body: string | null;
  status: string | null;
  created_at: string;
}

export default function WhatsAppPage() {
  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [messages, setMessages] = useState<
    WhatsAppMessage[]
  >([]);

  const [
    selectedConversationId,
    setSelectedConversationId,
  ] = useState<number | null>(null);

  const [search, setSearch] =
    useState("");

  const [newMessage, setNewMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  async function loadInbox() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/whatsapp/inbox",
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

      setMessages(
        result.messages || []
      );

      setSelectedConversationId(
        (current) =>
          current ??
          result.conversations?.[0]
            ?.id ??
          null
      );
    } catch (error) {
      console.error(
        "Inbox loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInbox();
  }, []);

  const filteredConversations =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return conversations;
      }

      return conversations.filter(
        (conversation) =>
          String(
            conversation.customer_name ||
              ""
          )
            .toLowerCase()
            .includes(value) ||
          conversation.phone
            .toLowerCase()
            .includes(value)
      );
    }, [
      conversations,
      search,
    ]);

  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation.id ===
        selectedConversationId
    ) || null;

  const selectedMessages =
    messages.filter(
      (message) =>
        message.conversation_id ===
        selectedConversationId
    );

  function formatTime(
    value: string | null
  ) {
    if (!value) return "";

    return new Date(
      value
    ).toLocaleTimeString(
      "fr-FR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  async function handleSendMessage() {
    if (
      !selectedConversation ||
      !newMessage.trim() ||
      sending
    ) {
      return;
    }

    const text =
      newMessage.trim();

    try {
      setSending(true);

      const response =
        await fetch(
          "/api/whatsapp/reply",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              conversation_id:
                selectedConversation.id,

              message: text,
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
            "Erreur lors de l'envoi."
        );
      }

      setNewMessage("");

      await loadInbox();
    } catch (error) {
      console.error(
        "Send reply error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'envoi du message."
      );
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  return (
    <div className="flex h-[calc(100vh-80px)] min-h-[650px] overflow-hidden rounded-2xl border bg-white shadow-sm">

      {/* ================================================= */}
      {/* CONVERSATIONS */}
      {/* ================================================= */}

      <aside className="flex w-[360px] flex-col border-r bg-white">

        <div className="border-b px-5 py-4">

          <div className="mb-4 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <MessageCircle size={21} />
            </div>

            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                WhatsApp
              </h1>

              <p className="text-xs text-slate-500">
                Conversations clients
              </p>
            </div>

          </div>

          <div className="relative">

            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Rechercher..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-slate-300"
            />

          </div>

        </div>

        <div className="flex-1 overflow-y-auto">

          {loading ? (
            <div className="p-5 text-sm text-slate-500">
              Chargement...
            </div>
          ) : filteredConversations.length ===
            0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center text-slate-400">

              <MessageCircle
                size={40}
                strokeWidth={1.5}
              />

              <p className="mt-3 text-sm">
                Aucune conversation
              </p>

            </div>
          ) : (
            filteredConversations.map(
              (conversation) => {

                const lastMessage =
                  messages
                    .filter(
                      (message) =>
                        message.conversation_id ===
                        conversation.id
                    )
                    .at(-1);

                const active =
                  conversation.id ===
                  selectedConversationId;

                return (
                  <button
                    key={
                      conversation.id
                    }
                    type="button"
                    onClick={() =>
                      setSelectedConversationId(
                        conversation.id
                      )
                    }
                    className={`flex w-full gap-3 border-b px-5 py-4 text-left transition ${
                      active
                        ? "bg-slate-50"
                        : "hover:bg-slate-50/70"
                    }`}
                  >

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                      {(
                        conversation.customer_name ||
                        "?"
                      )
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex items-center justify-between gap-2">

                        <span className="truncate text-sm font-semibold text-slate-900">
                          {
                            conversation.customer_name ||
                            conversation.phone
                          }
                        </span>

                        <span className="shrink-0 text-[11px] text-slate-400">
                          {formatTime(
                            conversation.last_message_at
                          )}
                        </span>

                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2">

                        <p className="truncate text-xs text-slate-500">
                          {lastMessage?.body ||
                            "Aucune message"}
                        </p>

                        {conversation.unread_count >
                          0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1.5 text-[10px] font-bold text-white">
                            {
                              conversation.unread_count
                            }
                          </span>
                        )}

                      </div>

                    </div>

                  </button>
                );
              }
            )
          )}

        </div>

      </aside>

      {/* ================================================= */}
      {/* CHAT */}
      {/* ================================================= */}

      <section className="flex min-w-0 flex-1 flex-col">

        {!selectedConversation ? (

          <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">

            <MessageCircle
              size={50}
              strokeWidth={1.4}
            />

            <h2 className="mt-4 text-sm font-semibold text-slate-700">
              Sélectionnez une conversation
            </h2>

            <p className="mt-1 text-xs">
              Les messages WhatsApp apparaîtront ici.
            </p>

          </div>

        ) : (

          <>
            {/* HEADER */}

            <header className="flex items-center justify-between border-b px-6 py-4">

              <div>

                <h2 className="text-sm font-semibold text-slate-900">
                  {
                    selectedConversation.customer_name ||
                    selectedConversation.phone
                  }
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {
                    selectedConversation.phone
                  }
                </p>

              </div>

              {selectedConversation.order_id && (
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                  Commande #
                  {
                    selectedConversation.order_id
                  }
                </span>
              )}

            </header>

            {/* MESSAGES */}

            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-6 py-6">

              {selectedMessages.length ===
              0 ? (

                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Aucun message
                </div>

              ) : (

                selectedMessages.map(
                  (message) => {

                    const outgoing =
                      message.direction ===
                      "outgoing";

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          outgoing
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >

                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                            outgoing
                              ? "bg-green-600 text-white"
                              : "border bg-white text-slate-800"
                          }`}
                        >

                          <p className="whitespace-pre-wrap break-words">
                            {message.body ||
                              `[${message.message_type}]`}
                          </p>

                          <div
                            className={`mt-1 text-[10px] ${
                              outgoing
                                ? "text-green-100"
                                : "text-slate-400"
                            }`}
                          >
                            {formatTime(
                              message.created_at
                            )}

                            {outgoing &&
                              message.status &&
                              ` · ${message.status}`}
                          </div>

                        </div>

                      </div>
                    );
                  }
                )

              )}

            </div>

            {/* COMPOSER */}

            <div className="border-t bg-white p-4">

              <div className="flex gap-2">

                <input
                  value={newMessage}
                  onChange={(event) =>
                    setNewMessage(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handleKeyDown
                  }
                  disabled={sending}
                  placeholder="Écrire un message..."
                  className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={
                    handleSendMessage
                  }
                  disabled={
                    sending ||
                    !newMessage.trim()
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send
                    size={18}
                  />
                </button>

              </div>

              <p className="mt-2 text-[11px] text-slate-400">
                {sending
                  ? "Envoi en cours..."
                  : "Entrée pour envoyer"}
              </p>

            </div>

          </>
        )}

      </section>

    </div>
  );
}