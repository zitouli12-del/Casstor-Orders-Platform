import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Phone,
  User,
  X,
} from "lucide-react";

interface BlacklistModalProps {
  open: boolean;
  clientName?: string | null;
  phone?: string | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: (data: {
    reason: string;
    notes: string;
  }) => Promise<void>;
}

export default function BlacklistModal({
  open,
  clientName,
  phone,
  saving,
  onClose,
  onConfirm,
}: BlacklistModalProps) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
      setNotes("");
    }
  }, [open]);

  if (!open) return null;

  const canSubmit = reason.trim().length > 0 && !saving;

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!canSubmit) return;

    await onConfirm({
      reason: reason.trim(),
      notes: notes.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={saving ? undefined : onClose}
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Ajouter à la blacklist
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Ce client sera signalé lors de ses prochaines
                commandes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fermer"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <User size={15} className="text-slate-400" />

                <span>{clientName || "Client sans nom"}</span>
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <Phone size={15} className="text-slate-400" />

                <span className="font-medium tracking-wide">
                  {phone || "-"}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="blacklist-reason"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Raison
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                id="blacklist-reason"
                type="text"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                disabled={saving}
                placeholder="Ex: Refus colis + injoignable"
                maxLength={200}
                autoFocus
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            <div>
              <label
                htmlFor="blacklist-notes"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Note
                <span className="ml-1 font-normal text-slate-400">
                  (optionnelle)
                </span>
              </label>

              <textarea
                id="blacklist-notes"
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                disabled={saving}
                placeholder="Ajoutez des détails utiles sur ce client..."
                rows={4}
                maxLength={1000}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                  Ajout...
                </>
              ) : (
                <>
                  <AlertTriangle size={17} />

                  Ajouter à la blacklist
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}