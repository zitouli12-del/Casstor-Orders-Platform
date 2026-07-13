import { Truck } from "lucide-react";

import { Order } from "@/src/types/Order";

interface DeliveryCardProps {
  editedFields: Partial<Order>;
  handleFieldChange: <K extends keyof Order>(
    field: K,
    value: Order[K]
  ) => void;
}

export default function DeliveryCard({
  editedFields,
  handleFieldChange,
}: DeliveryCardProps) {
  return (
    <section className="flex min-h-[230px] flex-col rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-5 flex items-center gap-2">
        <Truck size={17} className="text-blue-600" />

        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
          Livraison
        </h3>
      </div>

      <textarea
        value={editedFields.livreur_comment || ""}
        onChange={(e) =>
          handleFieldChange(
            "livreur_comment",
            e.target.value
          )
        }
        className="min-h-[140px] w-full flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
        placeholder="Instructions pour le livreur..."
        aria-label="Commentaire livreur"
      />
    </section>
  );
}