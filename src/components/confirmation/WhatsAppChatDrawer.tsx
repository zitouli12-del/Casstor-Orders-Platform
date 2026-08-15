"use client";

import {
  MessageCircle,
  Send,
  X,
} from "lucide-react";

import { useState } from "react";

import { OrderWithCompatibleShipments } from "@/src/types/OrderWithCompatibleShipments";

interface WhatsAppChatDrawerProps {
  order: OrderWithCompatibleShipments | null;
  open: boolean;
  onClose: () => void;
}

export default function WhatsAppChatDrawer({
  order,
  open,
  onClose,
}: WhatsAppChatDrawerProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !order) {
    return null;
  }

  async function sendMessage() {
    const text = message.trim();

    if (!text || !order) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/whatsapp/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: order.id,
          phone: order.phone,
          message: text,
        }),
      });

      const result = await response.json();

      console.log("===== WHATSAPP SEND RESULT =====");
      console.log("HTTP STATUS:", response.status);
      console.log("API RESULT:", result);
      console.log("META RESPONSE:", result?.meta_response);
      console.log("META ERROR:", result?.meta_response?.error);
      console.log("================================");

      if (!response.ok || !result.success) {
        const metaError = result?.meta_response?.error;

        const metaMessage =
          metaError?.message ||
          result?.meta_response?.message ||
          result?.message ||
          "Impossible d'envoyer le message WhatsApp.";

        const metaCode = metaError?.code
          ? `Code: ${metaError.code}`
          : "";

        const metaType = metaError?.type
          ? `Type: ${metaError.type}`
          : "";

        const fullError = [
          metaMessage,
          metaCode,
          metaType,
        ]
          .filter(Boolean)
          .join(" — ");

        setError(fullError);

        return;
      }

      // Message envoyé avec succès
      setMessage("");

      console.log("WhatsApp message sent:", result);
    } catch (err) {
      console.error("Erreur envoi WhatsApp:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Une erreur inattendue est survenue."
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[80] bg-slate-900/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-[90] flex h-full w-full max-w-md flex-col bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100">
              <MessageCircle
                className="h-6 w-6 text-green-600"
                strokeWidth={2.2}
              />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">
                WhatsApp
              </h2>

              <p className="text-sm text-slate-600">
                {order.name}
              </p>

              <p className="text-xs text-slate-400">
                {order.phone}
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-5">

          <div className="flex h-full items-center justify-center">

            <div className="max-w-xs text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <MessageCircle
                  className="h-7 w-7 text-green-600"
                  strokeWidth={1.8}
                />
              </div>

              <h3 className="text-sm font-semibold text-slate-800">
                Conversation WhatsApp
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                La conversation avec ce client apparaîtra ici.
              </p>

            </div>

          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="border-t border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Message */}
        <div className="border-t border-slate-200 bg-white p-4">

          <div className="flex items-end gap-2">

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Écrire un message..."
              rows={1}
              disabled={isSending}
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-green-400 focus:bg-white focus:ring-2 focus:ring-green-500/10 disabled:opacity-60"
            />

            <button
              type="button"
              onClick={sendMessage}
              disabled={!message.trim() || isSending}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-green-500 text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-40"
              title="Envoyer"
            >
              <Send
                size={18}
                className={isSending ? "animate-pulse" : ""}
              />
            </button>

          </div>

        </div>

      </div>
    </>
  );
}