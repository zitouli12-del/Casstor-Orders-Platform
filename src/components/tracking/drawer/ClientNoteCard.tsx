import { useEffect, useState } from "react";
import {
  FileText,
  LoaderCircle,
} from "lucide-react";

import { Shipment } from "@/src/types/Shipment";

interface ClientNoteCardProps {
  shipment: Shipment;
  onSave: (note: string) => Promise<void>;
}

export default function ClientNoteCard({
  shipment,
  onSave,
}: ClientNoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote(shipment.client_note ?? "");
  }, [shipment]);

  async function handleSave() {
    try {
      setSaving(true);

      await onSave(note);

      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setNote(shipment.client_note ?? "");
    setEditing(false);
  }

  const updatedAt = shipment.client_note_updated_at
    ? new Date(
        shipment.client_note_updated_at
      ).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-8">
      <div className="mb-6 flex items-center gap-3">
        <FileText
          size={20}
          className="text-orange-500"
        />

        <h3 className="text-lg font-semibold uppercase tracking-wider text-gray-700">
          Note interne
        </h3>
      </div>

      {!editing ? (
        <>
          <div className="flex-1 overflow-y-auto">
            {note ? (
              <p className="whitespace-pre-wrap text-[15px] leading-7 text-gray-700">
                {note}
              </p>
            ) : (
              <p className="italic text-gray-400">
                Aucune note interne.
              </p>
            )}
          </div>

          <div className="mt-8 border-t border-gray-200 pt-5">
            {updatedAt && (
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Dernière modification
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  {updatedAt}
                </p>
              </div>
            )}

            <button
              onClick={() => setEditing(true)}
              className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold transition hover:bg-gray-50"
            >
              {note ? "Modifier" : "Ajouter"}
            </button>
          </div>
        </>
      ) : (
        <>
          <textarea
            value={note}
            onChange={(e) =>
              setNote(e.target.value)
            }
            placeholder="Écrivez une note..."
            className="h-[230px] w-full resize-none rounded-2xl border border-gray-200 p-4 text-sm leading-6 outline-none transition focus:border-orange-400"
          />

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Annuler
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}