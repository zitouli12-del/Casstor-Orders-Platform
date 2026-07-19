import {
  PackageSearch,
  X,
} from "lucide-react";

import { Shipment } from "@/src/types/Shipment";
import CompatibleShipmentCard from "./CompatibleShipmentCard";

interface Props {
  open: boolean;
  shipments: Shipment[];
  onClose: () => void;
  onSelect: (shipment: Shipment) => void;
}

export default function ChangeClientDrawer({
  open,
  shipments,
  onClose,
  onSelect,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="flex w-[460px] flex-col bg-slate-50 shadow-2xl">
        {/* Header */}
        <div className="border-b bg-white px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-orange-100 p-2">
                <PackageSearch className="h-5 w-5 text-orange-600" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Changer le client
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Sélectionnez un colis compatible pour
                  remplacer le client.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 transition hover:bg-slate-100"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">
              Colis compatibles
            </h3>

            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
              {shipments.length}
            </span>
          </div>

          {shipments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Aucun colis compatible trouvé.
            </div>
          ) : (
            <div className="space-y-4">
              {shipments.map((shipment) => (
                <CompatibleShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}