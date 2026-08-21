"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle,
  Search,
  Send,
  Mic,
  Square,
  X,
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

type RecorderState =
  | "idle"
  | "recording"
  | "preview";

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

  // =====================================================
  // IMAGE
  // =====================================================

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [imageCaption, setImageCaption] =
    useState("");

  // =====================================================
  // AUDIO RECORDING
  // =====================================================

  const [recorderState, setRecorderState] =
    useState<RecorderState>("idle");

  const [recordingSeconds, setRecordingSeconds] =
    useState(0);

  const [recordedAudio, setRecordedAudio] =
    useState<File | null>(null);

  const [audioPreviewUrl, setAudioPreviewUrl] =
    useState<string | null>(null);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const mediaStreamRef =
    useRef<MediaStream | null>(null);

  const audioChunksRef =
    useRef<Blob[]>([]);

  const recordingTimerRef =
    useRef<ReturnType<
      typeof setInterval
    > | null>(null);

  // =====================================================
  // LOAD INBOX
  // =====================================================

  async function loadInbox() {
    try {
      setLoading(true);

      const response =
        await fetch(
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

  // =====================================================
  // CLEANUP AUDIO PREVIEW
  // =====================================================

  useEffect(() => {
    return () => {
      if (
        audioPreviewUrl
      ) {
        URL.revokeObjectURL(
          audioPreviewUrl
        );
      }

      if (
        recordingTimerRef.current
      ) {
        clearInterval(
          recordingTimerRef.current
        );
      }

      mediaStreamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );
    };
  }, [
    audioPreviewUrl,
  ]);

  // =====================================================
  // FILTER CONVERSATIONS
  // =====================================================

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

  function formatRecordingTime(
    seconds: number
  ) {
    const minutes =
      Math.floor(seconds / 60);

    const remainingSeconds =
      seconds % 60;

    return `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(
      2,
      "0"
    )}`;
  }

  // =====================================================
  // SEND TEXT
  // =====================================================

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

  // =====================================================
  // SEND IMAGE
  // =====================================================

  async function handleSendImage() {
    if (
      !selectedConversation ||
      !selectedImage ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);

      const formData =
        new FormData();

      formData.append(
        "conversation_id",
        String(
          selectedConversation.id
        )
      );

      formData.append(
        "file",
        selectedImage
      );

      formData.append(
        "caption",
        imageCaption.trim()
      );

      const response =
        await fetch(
          "/api/whatsapp/media/send",
          {
            method: "POST",
            body: formData,
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
            "Erreur lors de l'envoi de l'image."
        );
      }

      setSelectedImage(null);
      setImageCaption("");

      await loadInbox();
    } catch (error) {
      console.error(
        "Send image error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'envoi de l'image."
      );
    } finally {
      setSending(false);
    }
  }

  // =====================================================
  // START AUDIO RECORDING
  // =====================================================

  async function startAudioRecording() {
    if (
      sending ||
      recorderState ===
        "recording"
    ) {
      return;
    }

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
          .getUserMedia
      ) {
        throw new Error(
          "Votre navigateur ne permet pas l'accès au microphone."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          }
        );

      mediaStreamRef.current =
        stream;

      audioChunksRef.current =
        [];

      setRecordingSeconds(
        0
      );

      setRecorderState(
        "recording"
      );

      let mimeType = "";

      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
      ];

      for (const type of mimeTypes) {
        if (
          MediaRecorder.isTypeSupported(
            type
          )
        ) {
          mimeType = type;
          break;
        }
      }

      const recorder =
        mimeType
          ? new MediaRecorder(
              stream,
              {
                mimeType,
              }
            )
          : new MediaRecorder(
              stream
            );

      mediaRecorderRef.current =
        recorder;

      recorder.ondataavailable =
        (event) => {
          if (
            event.data &&
            event.data.size > 0
          ) {
            audioChunksRef.current.push(
              event.data
            );
          }
        };

      recorder.onerror =
        (event) => {
          console.error(
            "MediaRecorder error:",
            event
          );

          stopMediaTracks();

          setRecorderState(
            "idle"
          );

          setRecordingSeconds(
            0
          );

          alert(
            "Erreur pendant l'enregistrement audio."
          );
        };

      recorder.onstop =
        async () => {
          try {
            const chunks =
              audioChunksRef.current;

            if (!chunks.length) {
              throw new Error(
                "Aucun audio enregistré."
              );
            }

            const recordedBlob =
              new Blob(
                chunks,
                {
                  type:
                    recorder.mimeType ||
                    "audio/webm",
                }
              );

            console.log(
              "Recorded browser audio:",
              recordedBlob.type,
              recordedBlob.size
            );

            const mp3File =
              await convertBlobToMp3(
                recordedBlob
              );

            setRecordedAudio(
              mp3File
            );

            if (
              audioPreviewUrl
            ) {
              URL.revokeObjectURL(
                audioPreviewUrl
              );
            }

            const previewUrl =
              URL.createObjectURL(
                mp3File
              );

            setAudioPreviewUrl(
              previewUrl
            );

            setRecorderState(
              "preview"
            );
          } catch (error) {
            console.error(
              "Audio conversion error:",
              error
            );

            setRecorderState(
              "idle"
            );

            alert(
              error instanceof Error
                ? error.message
                : "Impossible de préparer l'audio."
            );
          } finally {
            stopMediaTracks();

            mediaRecorderRef.current =
              null;

            audioChunksRef.current =
              [];
          }
        };

      recorder.start();

      recordingTimerRef.current =
        setInterval(() => {
          setRecordingSeconds(
            (value) =>
              value + 1
          );
        }, 1000);
    } catch (error) {
      console.error(
        "Microphone error:",
        error
      );

      alert(
        error instanceof DOMException &&
          error.name ===
            "NotAllowedError"
          ? "Autorisez l'accès au microphone dans votre navigateur."
          : error instanceof Error
          ? error.message
          : "Impossible d'utiliser le microphone."
      );
    }
  }

  function stopMediaTracks() {
    mediaStreamRef.current
      ?.getTracks()
      .forEach((track) =>
        track.stop()
      );

    mediaStreamRef.current =
      null;

    if (
      recordingTimerRef.current
    ) {
      clearInterval(
        recordingTimerRef.current
      );

      recordingTimerRef.current =
        null;
    }
  }

  // =====================================================
  // STOP RECORDING
  // =====================================================

  function stopAudioRecording() {
    const recorder =
      mediaRecorderRef.current;

    if (
      !recorder ||
      recorder.state ===
        "inactive"
    ) {
      return;
    }

    recorder.stop();
  }

  // =====================================================
  // CANCEL RECORDED AUDIO
  // =====================================================

  function cancelRecordedAudio() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    stopMediaTracks();

    mediaRecorderRef.current =
      null;

    audioChunksRef.current =
      [];

    setRecordedAudio(null);

    if (
      audioPreviewUrl
    ) {
      URL.revokeObjectURL(
        audioPreviewUrl
      );
    }

    setAudioPreviewUrl(null);

    setRecordingSeconds(
      0
    );

    setRecorderState(
      "idle"
    );
  }

  // =====================================================
  // SEND RECORDED AUDIO
  // =====================================================

  async function handleSendRecordedAudio() {
    if (
      !selectedConversation ||
      !recordedAudio ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);

      const formData =
        new FormData();

      formData.append(
        "conversation_id",
        String(
          selectedConversation.id
        )
      );

      formData.append(
        "file",
        recordedAudio,
        "casstor-voice.mp3"
      );

      const response =
        await fetch(
          "/api/whatsapp/audio/send",
          {
            method: "POST",
            body: formData,
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
            "Erreur lors de l'envoi de l'audio."
        );
      }

      if (
        audioPreviewUrl
      ) {
        URL.revokeObjectURL(
          audioPreviewUrl
        );
      }

      setRecordedAudio(
        null
      );

      setAudioPreviewUrl(
        null
      );

      setRecordingSeconds(
        0
      );

      setRecorderState(
        "idle"
      );

      await loadInbox();
    } catch (error) {
      console.error(
        "Send audio error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'envoi de l'audio."
      );
    } finally {
      setSending(false);
    }
  }

  // =====================================================
  // CONVERT WEBM → MP3
  // =====================================================

  async function convertBlobToMp3(
    blob: Blob
  ): Promise<File> {
    const lamejs =
      await import("lamejs");

    const arrayBuffer =
      await blob.arrayBuffer();

    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error(
        "AudioContext n'est pas supporté par ce navigateur."
      );
    }

    const audioContext =
      new AudioContextClass();

    try {
      const audioBuffer =
        await audioContext.decodeAudioData(
          arrayBuffer.slice(0)
        );

      const channelCount =
        Math.min(
          audioBuffer.numberOfChannels,
          1
        );

      const sampleRate =
        audioBuffer.sampleRate;

      const samples =
        audioBuffer.getChannelData(
          0
        );

      const mp3encoder =
        new lamejs.Mp3Encoder(
          channelCount,
          sampleRate,
          128
        );

      const sampleBlockSize =
        1152;

      const mp3Data: BlobPart[] =
        [];

      const left =
        new Int16Array(
          sampleBlockSize
        );

      for (
        let i = 0;
        i < samples.length;
        i += sampleBlockSize
      ) {
        const sampleCount =
          Math.min(
            sampleBlockSize,
            samples.length - i
          );

        for (
          let j = 0;
          j < sampleCount;
          j++
        ) {
          const sample =
            Math.max(
              -1,
              Math.min(
                1,
                samples[i + j]
              )
            );

          left[j] =
            sample < 0
              ? sample * 0x8000
              : sample * 0x7fff;
        }

        const mp3buf =
          mp3encoder.encodeBuffer(
            left.subarray(
              0,
              sampleCount
            )
          );

        if (
          mp3buf.length > 0
        ) {
          mp3Data.push(
            new Int8Array(
              mp3buf
            ).buffer
          );
        }
      }

      const end =
        mp3encoder.flush();

      if (
        end.length > 0
      ) {
        mp3Data.push(
          new Int8Array(
            end
          ).buffer
        );
      }

      const mp3Blob =
        new Blob(
          mp3Data,
          {
            type:
              "audio/mpeg",
          }
        );

      return new File(
        [
          mp3Blob,
        ],
        "casstor-voice.mp3",
        {
          type:
            "audio/mpeg",
        }
      );
    } finally {
      await audioContext.close();
    }
  }

  // =====================================================
  // ENTER KEY
  // =====================================================

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSendMessage();
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

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
              value={
                search
              }
              onChange={(
                event
              ) =>
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
              (
                conversation
              ) => {
                const lastMessage =
                  messages
                    .filter(
                      (
                        message
                      ) =>
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
                        .slice(
                          0,
                          1
                        )
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
                  (
                    message
                  ) => {

                    const outgoing =
                      message.direction ===
                      "outgoing";

                    return (
                      <div
                        key={
                          message.id
                        }
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

                          {message.message_type ===
                            "image" &&
                          message.media_id ? (
                            <div className="space-y-2">

                              <img
                                src={`/api/whatsapp/media/${encodeURIComponent(
                                  message.media_id
                                )}`}
                                alt={
                                  message.caption ||
                                  "WhatsApp image"
                                }
                                className="max-h-[420px] max-w-[320px] rounded-xl object-contain"
                                loading="lazy"
                              />

                              {message.caption && (
                                <p className="whitespace-pre-wrap break-words">
                                  {
                                    message.caption
                                  }
                                </p>
                              )}

                            </div>

                          ) : message.message_type ===
                              "audio" &&
                            message.media_id ? (

                            <div className="space-y-2">

                              <audio
                                controls
                                preload="metadata"
                                className="max-w-full"
                                src={`/api/whatsapp/media/${encodeURIComponent(
                                  message.media_id
                                )}`}
                              />

                              <p className="text-xs opacity-70">
                                Message vocal
                              </p>

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
                              className="underline"
                            >
                              📄{" "}
                              {
                                message.caption ||
                                "Document"
                              }
                            </a>

                          ) : (

                            <p className="whitespace-pre-wrap break-words">
                              {message.body ||
                                `[${message.message_type}]`}
                            </p>

                          )}

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

            {/* ================================================= */}
            {/* COMPOSER */}
            {/* ================================================= */}

            <div className="border-t bg-white p-4">

              {/* IMAGE PREVIEW */}

              {selectedImage && (
                <div className="mb-3 flex items-center gap-3 rounded-xl border bg-slate-50 p-3">

                  <img
                    src={URL.createObjectURL(
                      selectedImage
                    )}
                    alt="Preview"
                    className="h-20 w-20 rounded-lg object-cover"
                  />

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-medium text-slate-700">
                      {
                        selectedImage.name
                      }
                    </p>

                    <input
                      value={
                        imageCaption
                      }
                      onChange={(
                        event
                      ) =>
                        setImageCaption(
                          event.target.value
                        )
                      }
                      placeholder="Ajouter une légende..."
                      className="mt-2 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none"
                    />

                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(
                        null
                      );

                      setImageCaption(
                        ""
                      );
                    }}
                    className="text-xs font-medium text-red-500"
                  >
                    Supprimer
                  </button>

                </div>
              )}

              {/* AUDIO RECORDING */}

              {recorderState ===
                "recording" && (
                <div className="mb-3 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                  <div className="flex items-center gap-3">

                    <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Enregistrement en cours
                      </p>

                      <p className="text-xs text-slate-500">
                        {
                          formatRecordingTime(
                            recordingSeconds
                          )
                        }
                      </p>
                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={
                      stopAudioRecording
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white"
                  >
                    <Square
                      size={16}
                      fill="currentColor"
                    />
                  </button>

                </div>
              )}

              {/* AUDIO PREVIEW */}

              {recorderState ===
                "preview" &&
                recordedAudio &&
                audioPreviewUrl && (
                  <div className="mb-3 rounded-xl border bg-slate-50 p-3">

                    <div className="mb-3 flex items-center justify-between">

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Audio prêt
                        </p>

                        <p className="text-xs text-slate-500">
                          {
                            formatRecordingTime(
                              recordingSeconds
                            )
                          }
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          cancelRecordedAudio
                        }
                        className="text-slate-500 hover:text-red-500"
                      >
                        <X
                          size={18}
                        />
                      </button>

                    </div>

                    <audio
                      controls
                      src={
                        audioPreviewUrl
                      }
                      className="w-full"
                    />

                    <div className="mt-3 flex justify-end">

                      <button
                        type="button"
                        onClick={
                          handleSendRecordedAudio
                        }
                        disabled={
                          sending
                        }
                        className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        <Send
                          size={15}
                        />

                        {sending
                          ? "Envoi..."
                          : "Envoyer"}
                      </button>

                    </div>

                  </div>
                )}

              {/* COMPOSER ROW */}

              {recorderState !==
                "recording" &&
                recorderState !==
                  "preview" && (
                  <div className="flex items-center gap-2">

                    {/* MICROPHONE */}

                    <button
                      type="button"
                      onClick={
                        startAudioRecording
                      }
                      disabled={
                        sending ||
                        !!selectedImage
                      }
                      title="Enregistrer un audio"
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Mic
                        size={18}
                      />
                    </button>

                    {/* IMAGE */}

                    <label className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">

                      📎

                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        disabled={
                          sending
                        }
                        onChange={(
                          event
                        ) => {
                          const file =
                            event.target.files?.[0];

                          if (!file)
                            return;

                          setSelectedImage(
                            file
                          );

                          event.currentTarget.value =
                            "";
                        }}
                      />

                    </label>

                    {/* TEXT */}

                    <input
                      value={
                        newMessage
                      }
                      onChange={(
                        event
                      ) =>
                        setNewMessage(
                          event.target.value
                        )
                      }
                      onKeyDown={
                        handleKeyDown
                      }
                      disabled={
                        sending ||
                        !!selectedImage
                      }
                      placeholder={
                        selectedImage
                          ? "Image sélectionnée..."
                          : "Écrire un message..."
                      }
                      className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    {/* SEND */}

                    {selectedImage ? (

                      <button
                        type="button"
                        onClick={
                          handleSendImage
                        }
                        disabled={
                          sending
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send
                          size={18}
                        />
                      </button>

                    ) : (

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

                    )}

                  </div>
                )}

              <p className="mt-2 text-[11px] text-slate-400">
                {recorderState ===
                "recording"
                  ? "تكلم دابا، ومن بعد ضغط Stop."
                  : recorderState ===
                    "preview"
                  ? "سمع التسجيل قبل الإرسال."
                  : "🎤 تسجيل الصوت · 📎 إرسال صورة · Enter لإرسال النص"}
              </p>

            </div>

          </>
        )}

      </section>

    </div>
  );
}