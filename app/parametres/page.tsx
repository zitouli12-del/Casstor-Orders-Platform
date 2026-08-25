"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageCircle, Power, PowerOff } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

interface AutomationSettings {
  id: string;
  store_id: number;
  stock_alternatives_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export default function ParametresPage() {
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAutomationSettings();
  }, []);

  async function loadAutomationSettings() {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("Utilisateur non authentifié.");
      }

      const { data: store, error: storeError } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (storeError) throw storeError;

      if (!store) {
        throw new Error("Store introuvable.");
      }

      const { data, error: settingsError } = await supabase
        .from("whatsapp_automation_settings")
        .select("id, store_id, stock_alternatives_enabled, created_at, updated_at")
        .eq("store_id", store.id)
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (data) {
        setSettings(data);
        setEnabled(Boolean(data.stock_alternatives_enabled));
      } else {
        setSettings(null);
        setEnabled(false);
      }
    } catch (err) {
      console.error("Erreur chargement paramètres WhatsApp:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les paramètres WhatsApp."
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleStockAlternatives() {
    if (saving) return;

    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Utilisateur non authentifié.");

      const { data: store, error: storeError } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (storeError) throw storeError;
      if (!store) throw new Error("Store introuvable.");

      const nextValue = !enabled;

      const { data, error: upsertError } = await supabase
        .from("whatsapp_automation_settings")
        .upsert(
          {
            store_id: store.id,
            stock_alternatives_enabled: nextValue,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "store_id" }
        )
        .select("id, store_id, stock_alternatives_enabled, created_at, updated_at")
        .single();

      if (upsertError) throw upsertError;

      setSettings(data);
      setEnabled(Boolean(data.stock_alternatives_enabled));
      setMessage(
        nextValue
          ? "WhatsApp Stock Alternatives activée."
          : "WhatsApp Stock Alternatives désactivée."
      );
    } catch (err) {
      console.error("Erreur sauvegarde paramètres WhatsApp:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer le paramètre."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <MessageCircle size={22} strokeWidth={1.9} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-600">
                WhatsApp Automation
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Automatisations WhatsApp
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
                Gérez les automatisations WhatsApp de votre store. Les nouvelles
                fonctionnalités d&apos;automation seront ajoutées ici progressivement.
              </p>
            </div>
          </div>
        </header>

        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-bold text-slate-900">
              Stock &amp; commande
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Automatisez la gestion des variantes indisponibles via WhatsApp.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      enabled
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {enabled ? (
                      <Power size={19} />
                    ) : (
                      <PowerOff size={19} />
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                      WhatsApp Stock Alternatives
                    </h3>
                    <p
                      className={`mt-1 text-xs font-semibold ${
                        enabled ? "text-emerald-600" : "text-slate-500"
                      }`}
                    >
                      {enabled ? "Activée" : "Désactivée"}
                    </p>
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                  Lorsqu&apos;une variante demandée n&apos;est plus disponible, le système
                  cherchera les autres couleurs disponibles pour le même produit et
                  la même taille / pointure, puis proposera ces alternatives au client
                  via WhatsApp.
                </p>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500">
                  <strong className="text-slate-700">Règle :</strong> le produit et la
                  taille / pointure restent identiques. Seule la couleur peut être
                  proposée comme alternative.
                </div>
              </div>

              <button
                type="button"
                onClick={toggleStockAlternatives}
                disabled={loading || saving}
                className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  enabled
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {saving
                  ? "Enregistrement..."
                  : enabled
                    ? "Désactiver"
                    : "Activer"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}