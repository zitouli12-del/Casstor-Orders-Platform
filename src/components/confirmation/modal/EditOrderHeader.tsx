import {
  X,
  Edit,
  Hash,
  Calendar,
  Clock,
} from "lucide-react";

import { Order } from "@/src/types/Order";

interface EditOrderHeaderProps {
  selectedOrder: Order;
  closeModal: () => void;
}

export default function EditOrderHeader({
  selectedOrder,
  closeModal,
}: EditOrderHeaderProps) {
  return (
    <div className="shrink-0 border-b border-slate-200 bg-white px-7 py-5">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Edit size={19} className="text-blue-600" />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">
                Modifier la commande
              </h2>

              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Hash size={13} />
                  {selectedOrder.id}
                </span>

                <span className="text-slate-300">•</span>

                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  Créée le{" "}
                  {new Date(
                    selectedOrder.created_at
                  ).toLocaleString("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>

                {selectedOrder.updated_at && (
                  <>
                    <span className="text-slate-300">•</span>

                    <span className="flex items-center gap-1.5">
                      <Clock size={13} />
                      Mise à jour le{" "}
                      {new Date(
                        selectedOrder.updated_at
                      ).toLocaleString("fr-FR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={closeModal}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
          aria-label="Fermer le dialogue"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}