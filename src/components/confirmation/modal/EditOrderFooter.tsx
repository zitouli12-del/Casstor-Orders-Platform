import { Save } from "lucide-react";

interface EditOrderFooterProps {
  isSaving: boolean;
  handleSave: () => void;
  closeModal: () => void;
}

export default function EditOrderFooter({
  isSaving,
  handleSave,
  closeModal,
}: EditOrderFooterProps) {
  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-7 py-4">
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={closeModal}
          className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
          aria-label="Annuler les modifications"
        >
          Annuler
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2"
          aria-label="Enregistrer les modifications"
        >
          <Save size={17} />

          {isSaving
            ? "Enregistrement..."
            : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}