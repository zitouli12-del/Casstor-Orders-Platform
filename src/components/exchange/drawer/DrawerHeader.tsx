import { RefreshCcw, X } from "lucide-react";

import { Shipment } from "@/src/types/Shipment";

interface DrawerHeaderProps {
  shipment: Shipment;
  onClose: () => void;
}

export default function DrawerHeader({
  shipment,
  onClose,
}: DrawerHeaderProps) {
  return (
    <div className="border-b border-slate-200 bg-white px-8 py-6">
      <div className="flex items-start justify-between">
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100">
              <RefreshCcw className="h-7 w-7 text-orange-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Créer un échange
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Créez une nouvelle expédition à partir de ce colis.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
              🔄 Échange
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              Colis #{shipment.id}
            </span>

            {shipment.tracking_number && (
              <span className="rounded-full bg-blue-50 px-3 py-1 font-mono text-sm text-blue-700">
                {shipment.tracking_number}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}