"use client";

import { Mic, Send, Square, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
type RecorderState = "idle" | "recording" | "preview";

interface WhatsAppComposerProps {
  selectedImage: File | null;
  setSelectedImage: Dispatch<SetStateAction<File | null>>;
  imageCaption: string;
  setImageCaption: Dispatch<SetStateAction<string>>;
  imagePreviewUrl: string | null;
  recorderState: RecorderState;
  convertingAudio: boolean;
  recordingSeconds: number;
  recordedAudio: File | null;
  audioPreviewUrl: string | null;
  sending: boolean;
  newMessage: string;
  setNewMessage: Dispatch<SetStateAction<string>>;
  startAudioRecording: () => void;
  stopAudioRecording: () => void;
  cancelRecordedAudio: () => void;
  handleSendRecordedAudio: () => void;
  handleSendImage: () => void;
  handleSendMessage: () => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

function formatRecordingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function WhatsAppComposer({
  selectedImage,
  setSelectedImage,
  imageCaption,
  setImageCaption,
  imagePreviewUrl,
  recorderState,
  convertingAudio,
  recordingSeconds,
  recordedAudio,
  audioPreviewUrl,
  sending,
  newMessage,
  setNewMessage,
  startAudioRecording,
  stopAudioRecording,
  cancelRecordedAudio,
  handleSendRecordedAudio,
  handleSendImage,
  handleSendMessage,
  handleKeyDown,
}: WhatsAppComposerProps) {
  return (
    <div className="border-t bg-white p-4">
      {selectedImage && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border bg-slate-50 p-3">
          {imagePreviewUrl && (
            <img
              src={imagePreviewUrl}
              alt="Preview"
              className="h-20 w-20 rounded-lg object-cover"
            />
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-700">
              {selectedImage.name}
            </p>

            <input
              value={imageCaption}
              onChange={(event) =>
                setImageCaption(event.target.value)
              }
              placeholder="Ajouter une légende..."
              className="mt-2 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedImage(null);
              setImageCaption("");
            }}
            disabled={sending}
            className="text-xs font-medium text-red-500"
          >
            Supprimer
          </button>
        </div>
      )}

      {recorderState === "recording" && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Enregistrement en cours
              </p>
              <p className="text-xs text-slate-500">
                {formatRecordingTime(recordingSeconds)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={stopAudioRecording}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <Square size={15} fill="currentColor" />
            Arrêter
          </button>
        </div>
      )}

      {convertingAudio && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Préparation de l'audio...
            </p>
            <p className="text-xs text-slate-500">
              Votre enregistrement est en cours de préparation.
            </p>
          </div>
        </div>
      )}

      {recorderState === "preview" &&
        recordedAudio &&
        audioPreviewUrl && (
          <div className="mb-3 rounded-xl border bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Audio prêt
                </p>
                <p className="text-xs text-slate-500">
                  {formatRecordingTime(recordingSeconds)}
                </p>
              </div>

              <button
                type="button"
                onClick={cancelRecordedAudio}
                disabled={sending}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-red-500"
              >
                <X size={18} />
              </button>
            </div>

            <audio
              controls
              preload="metadata"
              src={audioPreviewUrl}
              className="w-full"
            />

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelRecordedAudio}
                disabled={sending}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleSendRecordedAudio}
                disabled={sending}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={15} />
                {sending ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>
        )}

      {recorderState !== "recording" &&
        recorderState !== "preview" &&
        !convertingAudio && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startAudioRecording}
              disabled={sending || !!selectedImage}
              title="Enregistrer un audio"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Mic size={18} />
            </button>

            <label className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
              📎
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                disabled={sending}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setSelectedImage(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>

            <input
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending || !!selectedImage}
              placeholder={
                selectedImage
                  ? "Image sélectionnée..."
                  : "Écrire un message..."
              }
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {selectedImage ? (
              <button
                type="button"
                onClick={handleSendImage}
                disabled={sending}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={sending || !newMessage.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            )}
          </div>
        )}

      <p className="mt-2 text-[11px] text-slate-400">
        {recorderState === "recording"
          ? "تكلم دابا ثم اضغط «Arrêter»."
          : convertingAudio
          ? "Préparation de l'audio..."
          : recorderState === "preview"
          ? "سمع التسجيل قبل ما ترسلو."
          : "🎤 تسجيل الصوت · 📎 إرسال صورة · Enter لإرسال النص"}
      </p>
    </div>
  );
}