"use client";

import { ArrowLeft } from "lucide-react";
import type { Conversation } from "@/src/components/whatsapp/hooks/useWhatsAppInbox";

interface Props {
  conversation: Conversation;
  onBack?: () => void;
}

export default function WhatsAppChatHeader({
  conversation,
  onBack,
}: Props) {
  return (
    <header className="flex items-center justify-between border-b px-3 py-3 sm:px-6 sm:py-4">
      <div className="flex min-w-0 items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Retour aux conversations"
            className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 md:hidden"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-slate-900">
          {conversation.customer_name || conversation.phone}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">{conversation.phone}</p>
      </div>
      </div>

      {conversation.order_id && (
        <span className="hidden rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 sm:inline-flex">
          Commande #{conversation.order_id}
        </span>
      )}
    </header>
  );
}