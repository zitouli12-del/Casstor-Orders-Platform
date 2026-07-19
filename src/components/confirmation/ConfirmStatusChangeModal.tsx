"use client";

import {
  Ban,
  Copy,
  Loader2,
  X,
} from "lucide-react";

interface ConfirmStatusChangeModalProps {
  open: boolean;
  status: string | null;
  orderId: number | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const STATUS_CONFIG = {
  annule: {
    title: "Annuler cette commande ?",
    description:
      "En choisissant « Annulé », cette commande disparaîtra de la page Confirmation. Elle restera enregistrée dans la base de données avec le statut Annulé.",
    confirmLabel: "Oui, annuler",
    icon: Ban,
    iconClassName: "text-rose-600",
    iconContainerClassName: "bg-rose-100",
    buttonClassName:
      "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/20",
  },

  doublon: {
    title: "Marquer comme doublon ?",
    description:
      "Cette commande disparaîtra de la page Confirmation. Elle restera enregistrée dans la base de données avec le statut Doublon.",
    confirmLabel: "Oui, marquer comme doublon",
    icon: Copy,
    iconClassName: "text-orange-600",
    iconContainerClassName: "bg-orange-100",
    buttonClassName:
      "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500/20",
  },

} as const;

export default function ConfirmStatusChangeModal({
  open,
  status,
  orderId,
  loading,
  onClose,
  onConfirm,
}: ConfirmStatusChangeModalProps) {
  if (!open || !status) {
    return null;
  }

  const config =
    STATUS_CONFIG[
      status as keyof typeof STATUS_CONFIG
    ];

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <>
      <div
        onClick={loading ? undefined : onClose}
        className="fixed inset-0 z-[80] bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 px-6 pt-6">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${config.iconContainerClassName}`}
            >
              <Icon
                size={23}
                className={config.iconClassName}
                strokeWidth={2.2}
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Fermer"
            >
              <X size={19} />
            </button>
          </div>

          <div className="px-6 pb-6 pt-5">
            <h2 className="text-xl font-bold text-slate-950">
              {config.title}
            </h2>

            {orderId !== null && (
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Commande #{orderId}
              </p>
            )}

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {config.description}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Non, revenir
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${config.buttonClassName}`}
              >
                {loading && (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                )}

                {loading
                  ? "Enregistrement..."
                  : config.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}