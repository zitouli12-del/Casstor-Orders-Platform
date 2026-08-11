"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  MessageCircle,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";

interface WhatsAppConnection {
  id: number;
  store_id: number;
  phone_number: string;
  phone_number_id: string;
  waba_id: string;
  access_token: string;
  is_active: boolean;
  webhook_enabled: boolean;
  webhook_verify_token: string;
  created_at: string;
  updated_at: string;
}

export default function WhatsAppConnectionCard() {
  const [connection, setConnection] =
    useState<WhatsAppConnection | null>(null);

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [form, setForm] = useState({
    phone_number: "",
    phone_number_id: "",
    waba_id: "",
    access_token: "",
  });

  useEffect(() => {
    fetchConnection();
  }, []);

  async function fetchConnection() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Erreur utilisateur:", userError);
      setLoading(false);
      return;
    }

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (storeError || !store) {
      console.error("Erreur store:", storeError);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .eq("store_id", store.id)
      .maybeSingle();

    if (error) {
      console.error("Erreur WhatsApp:", error);
      setLoading(false);
      return;
    }

    if (data) {
      setConnection(data);

      setForm({
        phone_number: data.phone_number || "",
        phone_number_id: data.phone_number_id || "",
        waba_id: data.waba_id || "",
        access_token: data.access_token || "",
      });
    }

    setLoading(false);
  }

  function startEditing() {
    if (!connection) {
      setIsEditing(true);
      return;
    }

    setForm({
      phone_number: connection.phone_number || "",
      phone_number_id: connection.phone_number_id || "",
      waba_id: connection.waba_id || "",
      access_token: connection.access_token || "",
    });

    setIsEditing(true);
  }

  function cancelEditing() {
    if (connection) {
      setForm({
        phone_number: connection.phone_number || "",
        phone_number_id: connection.phone_number_id || "",
        waba_id: connection.waba_id || "",
        access_token: connection.access_token || "",
      });
    }

    setShowToken(false);
    setIsEditing(false);
  }

  async function testConnection() {
    setMessage(null);
    setIsTesting(true);

    try {
      const response = await fetch("/api/whatsapp/test-connection", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessage({
          type: "error",
          text:
            result.message ||
            "Impossible de vérifier la connexion WhatsApp.",
        });

        return;
      }

      setMessage({
        type: "success",
        text: result.message || "Connexion WhatsApp vérifiée avec succès.",
      });
    } catch (error) {
      console.error("Erreur Test Connection:", error);

      setMessage({
        type: "error",
        text: "Une erreur inattendue est survenue.",
      });
    } finally {
      setIsTesting(false);
    }
  }

  async function saveConnection() {
    setMessage(null);

    if (
      !form.phone_number.trim() ||
      !form.phone_number_id.trim() ||
      !form.waba_id.trim() ||
      !form.access_token.trim()
    ) {
      setMessage({
        type: "error",
        text: "Veuillez remplir tous les champs requis.",
      });
      return;
    }

    setIsSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsSaving(false);
      return;
    }

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (storeError || !store) {
      console.error("Erreur store:", storeError);
      setIsSaving(false);
      return;
    }

    const payload = {
      store_id: store.id,
      phone_number: form.phone_number.trim(),
      phone_number_id: form.phone_number_id.trim(),
      waba_id: form.waba_id.trim(),
      access_token: form.access_token.trim(),
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    let error;

    if (connection) {
      const result = await supabase
        .from("whatsapp_connections")
        .update(payload)
        .eq("id", connection.id);

      error = result.error;
    } else {
      const result = await supabase
        .from("whatsapp_connections")
        .insert(payload);

      error = result.error;
    }

    if (error) {
      console.error("Erreur sauvegarde WhatsApp:", error);

      setMessage({
        type: "error",
        text: error.message || "Erreur lors de la sauvegarde.",
      });

      setIsSaving(false);
      return;
    }

    await fetchConnection();

    setMessage({
      type: "success",
      text: "Connexion WhatsApp enregistrée avec succès.",
    });

    setShowToken(false);
    setIsEditing(false);
    setIsSaving(false);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <MessageCircle
            size={18}
            className="animate-pulse text-green-500"
          />
          Chargement de WhatsApp...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60">

      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <MessageCircle size={19} />
            </div>

            <div>
              <h3 className="font-semibold text-slate-800">
                WhatsApp Business
              </h3>

              <p className="text-xs text-slate-500">
                Configurez votre connexion WhatsApp.
              </p>
            </div>

          </div>

          {connection?.is_active ? (
            <div className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
              <CheckCircle2 size={13} />
              Actif
            </div>
          ) : (
            <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              Non configuré
            </div>
          )}

        </div>
      </div>

      {/* Content */}
      <div className="p-5">

        {message && (
          <div
            className={`mb-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-xs font-medium ${
              message.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
            )}

            <span>{message.text}</span>
          </div>
        )}

        {!isEditing && !connection ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

            <p className="text-sm font-semibold text-amber-800">
              WhatsApp n'est pas configuré
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-700">
              Ajoutez les informations de votre compte WhatsApp Business
              pour commencer la configuration.
            </p>

            <button
              type="button"
              onClick={startEditing}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-green-700"
            >
              <MessageCircle size={15} />
              Configurer WhatsApp
            </button>

          </div>
        ) : !isEditing && connection ? (
          <div className="space-y-4">

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Numéro WhatsApp
              </p>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
                {connection.phone_number}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Phone Number ID
              </p>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
                {connection.phone_number_id}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                WABA ID
              </p>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
                {connection.waba_id}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Access Token
              </p>

              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
                  {showToken
                    ? connection.access_token
                    : "••••••••••••••••••••••••"}
                </div>

                <button
                  type="button"
                  onClick={() => setShowToken((prev) => !prev)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
                >
                  {showToken ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={testConnection}
                disabled={isTesting}
                className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2
                  size={14}
                  className={isTesting ? "animate-pulse" : ""}
                />
                {isTesting ? "Vérification..." : "Tester la connexion"}
              </button>

              <button
                type="button"
                onClick={startEditing}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil size={14} />
                Modifier
              </button>
            </div>

          </div>
        ) : (
          <div className="space-y-4">

            {/* Phone */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Numéro WhatsApp *
              </label>

              <input
                type="text"
                value={form.phone_number}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    phone_number: e.target.value,
                  }))
                }
                placeholder="+212 6 XX XX XX XX"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-500/10"
              />
            </div>

            {/* Phone Number ID */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Phone Number ID *
              </label>

              <input
                type="text"
                value={form.phone_number_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    phone_number_id: e.target.value,
                  }))
                }
                placeholder="Phone Number ID"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-500/10"
              />
            </div>

            {/* WABA */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                WABA ID *
              </label>

              <input
                type="text"
                value={form.waba_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    waba_id: e.target.value,
                  }))
                }
                placeholder="WhatsApp Business Account ID"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-500/10"
              />
            </div>

            {/* Token */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Access Token *
              </label>

              <div className="flex gap-2">

                <input
                  type={showToken ? "text" : "password"}
                  value={form.access_token}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      access_token: e.target.value,
                    }))
                  }
                  placeholder="Access Token"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-500/10"
                />

                <button
                  type="button"
                  onClick={() => setShowToken((prev) => !prev)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
                >
                  {showToken ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>

              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">

              <button
                type="button"
                onClick={cancelEditing}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <X size={14} />
                Annuler
              </button>

              <button
                type="button"
                onClick={saveConnection}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={14} />
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}