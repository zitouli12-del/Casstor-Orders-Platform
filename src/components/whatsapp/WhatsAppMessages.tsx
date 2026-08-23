"use client";

import { useEffect, useRef } from "react";
import type { WhatsAppMessage } from "@/src/components/whatsapp/hooks/useWhatsAppInbox";
import WhatsAppMessageBubble from "./WhatsAppMessageBubble";

interface WhatsAppMessagesProps {
  messages: WhatsAppMessage[];
  conversationId: number | null;
  onLoadOlder: () => void;
  hasMoreMessages: boolean;
  loadingOlderMessages: boolean;
}

export default function WhatsAppMessages({
  messages,
  conversationId,
  onLoadOlder,
  hasMoreMessages,
  loadingOlderMessages,
}: WhatsAppMessagesProps) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const previousHeightRef =
    useRef<number | null>(null);

  const loadingRef =
    useRef(false);

  // Start with null so the first loaded conversation is treated
  // as a real conversation change and is scrolled to the bottom.
  const previousConversationIdRef =
    useRef<number | null>(null);

  const previousMessageCountRef =
    useRef(messages.length);

  const autoScrollOnLoadRef =
    useRef(false);

  const autoScrollTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const contentRef =
    useRef<HTMLDivElement | null>(null);

  const scrollToBottom =
    () => {
      const container =
        containerRef.current;

      if (!container) return;

      container.scrollTop =
        container.scrollHeight;
    };

  const armInitialAutoScroll =
    () => {
      autoScrollOnLoadRef.current =
        true;

      if (
        autoScrollTimerRef.current
      ) {
        clearTimeout(
          autoScrollTimerRef.current
        );
      }

      // Run after the current render.
      requestAnimationFrame(
        scrollToBottom
      );

      // Run again after images/audio/layout have had
      // a chance to update the content height.
      setTimeout(
        scrollToBottom,
        60
      );

      setTimeout(
        scrollToBottom,
        220
      );

      autoScrollTimerRef.current =
        setTimeout(() => {
          autoScrollOnLoadRef.current =
            false;
        }, 900);
    };

  // 1) On a new conversation, jump directly to the newest message.
  // 2) When older messages are prepended, preserve the visual position.
  // 3) When a new message arrives, only follow it if the user is already
  //    close to the bottom.
  useEffect(() => {
    const container =
      containerRef.current;

    if (!container) return;

    const previousConversationId =
      previousConversationIdRef.current;

    if (
      conversationId !== null &&
      conversationId !==
        previousConversationId
    ) {
      previousConversationIdRef.current =
        conversationId;

      previousMessageCountRef.current =
        messages.length;

      previousHeightRef.current = null;
      loadingRef.current = false;

      armInitialAutoScroll();

      return;
    }

    if (
      loadingRef.current &&
      previousHeightRef.current !== null
    ) {
      const heightDelta =
        container.scrollHeight -
        previousHeightRef.current;

      if (heightDelta > 0) {
        container.scrollTop +=
          heightDelta;
      }

      loadingRef.current = false;
      previousHeightRef.current = null;
      previousMessageCountRef.current =
        messages.length;

      return;
    }

    const previousCount =
      previousMessageCountRef.current;

    if (messages.length > previousCount) {
      if (
        autoScrollOnLoadRef.current
      ) {
        requestAnimationFrame(
          scrollToBottom
        );
      } else {
        const distanceFromBottom =
          container.scrollHeight -
          container.scrollTop -
          container.clientHeight;

        if (
          distanceFromBottom < 180
        ) {
          requestAnimationFrame(
            scrollToBottom
          );
        }
      }
    }

    previousMessageCountRef.current =
      messages.length;
  }, [
    conversationId,
    messages.length,
  ]);

  // Media can change the chat height after the messages
  // have been rendered (especially images/audio). While the
  // initial load is armed, follow those layout changes.
  useEffect(() => {
    const content =
      contentRef.current;

    if (
      !content ||
      typeof ResizeObserver ===
        "undefined"
    ) {
      return;
    }

    const observer =
      new ResizeObserver(() => {
        if (
          autoScrollOnLoadRef.current
        ) {
          scrollToBottom();
        }
      });

    observer.observe(content);

    return () => {
      observer.disconnect();

      if (
        autoScrollTimerRef.current
      ) {
        clearTimeout(
          autoScrollTimerRef.current
        );

        autoScrollTimerRef.current =
          null;
      }
    };
  }, [conversationId]);

  function handleScroll() {
    const container =
      containerRef.current;

    if (!container) return;

    if (
      container.scrollTop <= 120 &&
      hasMoreMessages &&
      !loadingOlderMessages
    ) {
      previousHeightRef.current =
        container.scrollHeight;

      loadingRef.current = true;
      onLoadOlder();
    }
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-5 py-5 md:px-7 md:py-6"
      style={{
        backgroundColor: "#efeae2",
        backgroundImage:
          "url('/whatsapp-chat-bg.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "520px",
      }}
    >
      {loadingOlderMessages && (
        <div className="mb-3 text-center text-xs text-slate-500">
          Chargement des anciens messages...
        </div>
      )}

      <div
        ref={contentRef}
        className="space-y-2.5"
      >
        {messages.map((message) => (
          <WhatsAppMessageBubble
            key={message.id}
            message={message}
          />
        ))}
        <div aria-hidden="true" className="h-px" />
      </div>
    </div>
  );
}