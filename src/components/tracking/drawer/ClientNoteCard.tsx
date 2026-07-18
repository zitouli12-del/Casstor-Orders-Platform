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
    <div className="rounded-3xl border border-gray-200 bg-white p-6">
      <div className="mb-5 flex items-center gap-3">
        <FileText
          size={18}
          className="text-orange-500"
        />

        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
          Note interne
        </h3>
      </div>

      {!editing ? (
        <>
          <div className="min-h-[90px]">
            {note ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {note}
              </p>
            ) : (
              <p className="italic text-sm text-gray-400">
                Aucune note interne.
              </p>
            )}
          </div>

          {updatedAt && (
            <p className="mt-4 text-xs text-gray-400">
              Dernière modification : {updatedAt}
            </p>
          )}

          <button
            onClick={() => setEditing(true)}
            className="mt-5 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium transition hover:bg-gray-50"
          >
            {note ? "Modifier" : "Ajouter"}
          </button>
        </>
      ) : (
        <>
          <textarea
            value={note}
            onChange={(e) =>
              setNote(e.target.value)
            }
            placeholder="Écrire une note..."
            className="h-32 w-full resize-none rounded-2xl border border-gray-200 p-4 text-sm outline-none focus:border-orange-400"
          />

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm transition hover:bg-gray-50"
            >
              Annuler
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={16}
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