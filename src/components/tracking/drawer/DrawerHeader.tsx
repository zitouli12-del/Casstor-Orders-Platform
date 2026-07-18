import { Check, Copy, X } from "lucide-react";
import { useState } from "react";

import { Shipment } from "@/src/types/Shipment";

interface DrawerHeaderProps {
  shipment: Shipment;
  onClose: () => void;
}

export default function DrawerHeader({
  shipment,
  onClose,
}: DrawerHeaderProps) {
  const [copied, setCopied] = useState(false);

  async function copyTracking() {
    if (!shipment.tracking_number) return;

    await navigator.clipboard.writeText(
      shipment.tracking_number
    );

    setCopied(true);

    setTimeout(() => setCopied(false), 1500);
  }

  function formatDate(date?: string | null) {
    if (!date) return "-";

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }
console.log("shipment =", shipment);
console.log("tracking_number =", shipment.tracking_number);
  return (
    <div className="border-b border-gray-200 bg-white px-8 py-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Détails de l'expédition
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span>#{shipment.orders?.id}</span>

            <span>•</span>

            <span>
              Créée le {formatDate(shipment.created_at)}
            </span>

            <span>•</span>

            <span>
              Mise à jour le{" "}
              {formatDate(
                shipment.updated_at ??
                  shipment.created_at
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
<div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 w-full md:w-auto md:min-w-[260px]">
  <span className="block truncate font-mono text-sm font-semibold">
    {shipment.tracking_number ?? "-"}
  </span>
</div>

          <button
            onClick={copyTracking}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 transition hover:bg-gray-50"
          >
            {copied ? (
              <Check
                size={18}
                className="text-green-600"
              />
            ) : (
              <Copy size={18} />
            )}
          </button>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}