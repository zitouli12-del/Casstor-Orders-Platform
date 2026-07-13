import { FileText } from "lucide-react";

import { Order } from "@/src/types/Order";

interface NotesCardProps {
  editedFields: Partial<Order>;
  handleFieldChange: <K extends keyof Order>(
    field: K,
    value: Order[K]
  ) => void;
}

export default function NotesCard({
  editedFields,
  handleFieldChange,
}: NotesCardProps) {
  return (
    <section className="flex min-h-[230px] flex-col rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-5 flex items-center gap-2">
        <FileText size={17} className="text-orange-500" />

        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
          Note interne
        </h3>
      </div>

      <textarea
        value={editedFields.notes || ""}
        onChange={(e) =>
          handleFieldChange("notes", e.target.value)
        }
        className="min-h-[140px] w-full flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
        placeholder="Ajouter une note interne..."
        aria-label="Note interne"
      />
    </section>
  );
}