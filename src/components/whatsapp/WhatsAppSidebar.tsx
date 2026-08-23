"use client";

import { useMemo } from "react";
import { MessageCircle, Search } from "lucide-react";
import type { Conversation, WhatsAppMessage } from "@/src/components/whatsapp/hooks/useWhatsAppInbox";

interface Props {
  conversations: Conversation[];
  selectedConversationId: number | null;
  onSelectConversation: (id: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  lastMessageByConversation: Map<number, WhatsAppMessage>;
}

function formatTime(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WhatsAppSidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
  search,
  onSearchChange,
  loading,
  lastMessageByConversation,
}: Props) {
  const filteredConversations = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return conversations;

    return conversations.filter(
      (conversation) =>
        String(conversation.customer_name || "")
          .toLowerCase()
          .includes(value) ||
        conversation.phone.toLowerCase().includes(value)
    );
  }, [conversations, search]);

  return (
    <aside className="flex w-[475px] flex-col border-r bg-white">
      <div className="border-b px-5 py-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <MessageCircle size={21} />
          </div>
          <div>
            <h1 className="text-[23px] font-semibold text-slate-900">WhatsApp</h1>
            <p className="text-[15px] text-slate-500">Conversations clients</p>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Rechercher..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-[17px] outline-none transition focus:border-slate-300"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-5 text-sm text-slate-500">Chargement...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-slate-400">
            <MessageCircle size={40} strokeWidth={1.5} />
            <p className="mt-3 text-sm">Aucune conversation</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const lastMessage = lastMessageByConversation.get(conversation.id);
            const active = conversation.id === selectedConversationId;

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelectConversation(conversation.id)}
                className={`flex w-full gap-3 border-b px-5 py-4 text-left transition ${
                  active
                    ? "bg-slate-100"
                    : "hover:bg-slate-50/70"
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                  {(conversation.customer_name || "?").slice(0, 1).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-base font-semibold text-slate-900">
                      {conversation.customer_name || conversation.phone}
                    </span>
                    <span className="shrink-0 text-[13px] text-slate-400">
                      {formatTime(conversation.last_message_at)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-[15px] text-slate-500">
                      {lastMessage?.body || "Aucun message"}
                    </p>
                    {conversation.unread_count > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1.5 text-[10px] font-bold text-white">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}