"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { MessageCircle } from "lucide-react";

import { useWhatsAppInbox } from "@/src/components/whatsapp/hooks/useWhatsAppInbox";
import WhatsAppSidebar from "@/src/components/whatsapp/WhatsAppSidebar";
import WhatsAppChatHeader from "@/src/components/whatsapp/WhatsAppChatHeader";
import WhatsAppMessages from "@/src/components/whatsapp/WhatsAppMessages";
import WhatsAppComposer from "@/src/components/whatsapp/WhatsAppComposer";

type RecorderState =
  | "idle"
  | "recording"
  | "preview";

export default function WhatsAppPage() {
  const {
    conversations,
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
  } = useWhatsAppInbox();

  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // =====================================================
  // IMAGE STATE
  // =====================================================

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [imageCaption, setImageCaption] =
    useState("");

  const [
    imagePreviewUrl,
    setImagePreviewUrl,
  ] = useState<string | null>(null);

  // =====================================================
  // AUDIO RECORDING STATE
  // =====================================================

  const [recorderState, setRecorderState] =
    useState<RecorderState>("idle");

  const [
    convertingAudio,
    setConvertingAudio,
  ] = useState(false);

  const [
    recordingSeconds,
    setRecordingSeconds,
  ] = useState(0);

  const [
    recordedAudio,
    setRecordedAudio,
  ] = useState<File | null>(null);

  const [
    audioPreviewUrl,
    setAudioPreviewUrl,
  ] = useState<string | null>(null);

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
  // FILTER CONVERSATIONS
  // =====================================================

  const filteredConversations =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

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

  // =====================================================
  // FORMAT TIME
  // =====================================================

  function formatTime(value: string | null) {
    if (!value) return "";

    return new Date(value).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // =====================================================
  // IMAGE PREVIEW
  // =====================================================

  useEffect(() => {
    if (!selectedImage) {
      setImagePreviewUrl(
        null
      );
      return;
    }

    const url =
      URL.createObjectURL(
        selectedImage
      );

    setImagePreviewUrl(
      url
    );

    return () => {
      URL.revokeObjectURL(
        url
      );
    };
  }, [
    selectedImage,
  ]);

  // =====================================================
  // AUDIO PREVIEW CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
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
  // STOP MICROPHONE TRACKS
  // =====================================================

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
  // START AUDIO RECORDING
  // =====================================================

  async function startAudioRecording() {
    if (
      sending ||
      recorderState ===
        "recording" ||
      convertingAudio
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

      setRecordedAudio(
        null
      );

      if (audioPreviewUrl) {
        URL.revokeObjectURL(
          audioPreviewUrl
        );
      }

      setAudioPreviewUrl(
        null
      );

      // The native Chrome MediaRecorder does not expose OGG/Opus
      // on this browser, so use opus-media-recorder as a polyfill.
      const opusModule =
        await import("opus-media-recorder");

      const OpusMediaRecorder =
        opusModule.default;

      const workerOptions = {
        encoderWorkerFactory: () =>
          new Worker(
            "/opus-media-recorder/encoderWorker.umd.js"
          ),

        OggOpusEncoderWasmPath:
          "/opus-media-recorder/OggOpusEncoder.wasm",

        WebMOpusEncoderWasmPath:
          "/opus-media-recorder/WebMOpusEncoder.wasm",
      };

      const RecorderClass =
        OpusMediaRecorder as unknown as new (
          stream: MediaStream,
          options?: MediaRecorderOptions,
          workerOptions?: {
            encoderWorkerFactory: () => Worker;
            OggOpusEncoderWasmPath: string;
            WebMOpusEncoderWasmPath: string;
          }
        ) => MediaRecorder;

      const recorder =
        new RecorderClass(
          stream,
          {
            mimeType:
              "audio/ogg",
          },
          workerOptions
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

          mediaRecorderRef.current =
            null;

          audioChunksRef.current =
            [];

          setRecorderState(
            "idle"
          );

          setConvertingAudio(
            false
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
          setConvertingAudio(
            false
          );

          setRecorderState(
            "idle"
          );

          try {
            const chunks =
              audioChunksRef.current;

            if (
              chunks.length === 0
            ) {
              throw new Error(
                "Aucun audio enregistré."
              );
            }

            const recordedBlob =
              new Blob(
                chunks,
                {
                  type:
                    "audio/ogg",
                }
              );

            console.log(
              "Recorded browser audio:",
              recordedBlob.type,
              recordedBlob.size
            );

            const audioFile =
              new File(
                [recordedBlob],
                "casstor-voice.ogg",
                {
                  type:
                    "audio/ogg",
                }
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
                audioFile
              );

            setRecordedAudio(
              audioFile
            );

            setAudioPreviewUrl(
              previewUrl
            );

            setRecorderState(
              "preview"
            );
          } catch (error) {
            console.error(
              "Audio recording error:",
              error
            );

            setRecordedAudio(
              null
            );

            setAudioPreviewUrl(
              null
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

            setConvertingAudio(
              false
            );
          }
        };

      setRecorderState(
        "recording"
      );

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

      stopMediaTracks();

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

  // =====================================================
  // STOP AUDIO RECORDING
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
    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !==
        "inactive"
    ) {
      try {
        recorder.stop();
      } catch {
        // ignore
      }
    }

    stopMediaTracks();

    mediaRecorderRef.current =
      null;

    audioChunksRef.current =
      [];

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

    setConvertingAudio(
      false
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
      sending ||
      convertingAudio
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
        "casstor-voice.ogg"
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

      <WhatsAppSidebar
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        lastMessageByConversation={lastMessageByConversation}
      />

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
            <WhatsAppChatHeader conversation={selectedConversation} />

            <WhatsAppMessages
              messages={selectedMessages}
              conversationId={
                selectedConversationId
              }
              onLoadOlder={() => {
                if (selectedConversationId) {
                  void loadOlderMessages(
                    selectedConversationId
                  );
                }
              }}
              hasMoreMessages={
                hasMoreMessages
              }
              loadingOlderMessages={
                loadingOlderMessages
              }
            />

            <WhatsAppComposer
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              imageCaption={imageCaption}
              setImageCaption={setImageCaption}
              imagePreviewUrl={imagePreviewUrl}
              recorderState={recorderState}
              convertingAudio={convertingAudio}
              recordingSeconds={recordingSeconds}
              recordedAudio={recordedAudio}
              audioPreviewUrl={audioPreviewUrl}
              sending={sending}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              startAudioRecording={startAudioRecording}
              stopAudioRecording={stopAudioRecording}
              cancelRecordedAudio={cancelRecordedAudio}
              handleSendRecordedAudio={handleSendRecordedAudio}
              handleSendImage={handleSendImage}
              handleSendMessage={handleSendMessage}
              handleKeyDown={handleKeyDown}
            />
          </>
        )}

      </section>
    </div>
  );
}