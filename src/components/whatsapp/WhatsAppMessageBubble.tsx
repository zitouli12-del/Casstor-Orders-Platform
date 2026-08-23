"use client";

import { Check, CheckCheck } from "lucide-react";
import type { WhatsAppMessage } from "@/src/components/whatsapp/hooks/useWhatsAppInbox";

interface WhatsAppMessageBubbleProps {
  message: WhatsAppMessage;
}

function formatTime(value: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderMessageStatus(status: string | null) {
  if (!status) return null;

  if (status === "sent") {
    return (
      <Check
        size={13}
        strokeWidth={2.2}
        className="ml-1"
        aria-label="Envoyé"
      />
    );
  }

  if (status === "delivered" || status === "read") {
    return (
      <CheckCheck
        size={13}
        strokeWidth={2.2}
        className={`ml-1 ${
          status === "read"
            ? "text-sky-500"
            : "text-slate-500"
        }`}
        aria-label={
          status === "read" ? "Lu" : "Livré"
        }
      />
    );
  }

  if (status === "failed") {
    return (
      <span
        title="Échec de l'envoi"
        aria-label="Échec de l'envoi"
        className="ml-1 font-semibold text-red-500"
      >
        !
      </span>
    );
  }

  return null;
}

export default function WhatsAppMessageBubble({
  message,
}: WhatsAppMessageBubbleProps) {
  const outgoing =
    message.direction === "outgoing";

  const bubbleClass = outgoing
    ? "rounded-2xl rounded-br-md bg-[#d9fdd3] text-slate-800"
    : "rounded-2xl rounded-bl-md bg-white text-slate-800";

  return (
    <div
      className={`flex ${
        outgoing
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`max-w-[78%] overflow-hidden ${bubbleClass} ${
          message.message_type === "image"
            ? "p-1.5"
            : message.message_type === "audio"
            ? "w-[340px] max-w-[88%] px-3 py-2.5"
            : "px-3.5 py-2.5"
        } shadow-[0_1px_1px_rgba(0,0,0,0.08)] md:max-w-[72%]`}
      >
        {message.message_type ===
          "image" &&
        message.media_id ? (
          <div className="space-y-1.5">
            <img
              src={`/api/whatsapp/media/${encodeURIComponent(
                message.media_id
              )}`}
              alt={
                message.caption ||
                "WhatsApp image"
              }
              className="block max-h-[420px] w-full max-w-[360px] rounded-xl object-contain"
              loading="lazy"
            />

            {message.caption && (
              <p className="whitespace-pre-wrap break-words px-1.5 pb-0.5 text-[17px] leading-relaxed">
                {message.caption}
              </p>
            )}
          </div>
        ) : message.message_type ===
            "audio" &&
          message.media_id ? (
          <div>
            <audio
              controls
              preload="metadata"
              className="w-full max-w-[320px]"
              src={`/api/whatsapp/media/${encodeURIComponent(
                message.media_id
              )}`}
            />
          </div>
        ) : message.message_type ===
            "video" &&
          message.media_id ? (
          <video
            controls
            preload="metadata"
            className="max-h-[420px] max-w-[360px] rounded-xl"
            src={`/api/whatsapp/media/${encodeURIComponent(
              message.media_id
            )}`}
          />
        ) : message.message_type ===
            "document" &&
          message.media_id ? (
          <a
            href={`/api/whatsapp/media/${encodeURIComponent(
              message.media_id
            )}`}
            target="_blank"
            rel="noreferrer"
            className="block break-words underline"
          >
            {message.caption ||
              "Document"}
          </a>
        ) : (
          <p className="whitespace-pre-wrap break-words text-[17px] leading-relaxed">
            {message.body ||
              `[${message.message_type}]`}
          </p>
        )}

        <div
          className={`mt-1 flex items-center justify-end gap-0.5 text-[9px] leading-none ${
            outgoing
              ? "text-slate-600"
              : "text-slate-400"
          }`}
        >
          <span>
            {formatTime(
              message.created_at
            )}
          </span>

          {outgoing &&
            renderMessageStatus(
              message.status
            )}
        </div>
      </div>
    </div>
  );
}