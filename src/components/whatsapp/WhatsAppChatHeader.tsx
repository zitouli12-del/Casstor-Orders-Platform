"use client";

import type { Conversation } from "@/src/components/whatsapp/hooks/useWhatsAppInbox";

interface Props { conversation: Conversation; }

export default function WhatsAppChatHeader({ conversation }: Props) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          {conversation.customer_name || conversation.phone}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">{conversation.phone}</p>
      </div>

      {conversation.order_id && (
        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
          Commande #{conversation.order_id}
        </span>
      )}
    </header>
  );
}