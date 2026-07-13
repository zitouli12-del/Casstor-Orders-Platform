import { Check, Copy, X } from "lucide-react";
import { useState } from "react";

import { Shipment } from "@/src/types/Shipment";
import TrackingStatusBadge from "../TrackingStatusBadge";

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

  return (
    <div className="border-b border-gray-200 bg-white px-8 py-7">
      <div className="flex items-start justify-between gap-8">
        {/* Left */}
        <div>
          <h1 className="text-[34px] font-bold tracking-tight text-gray-900">
            Détails de l'expédition
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-base text-gray-500">
              Commande #{shipment.orders?.id}
            </span>

            <TrackingStatusBadge
              status={shipment.shipping_status}
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3">
            <p className="font-mono text-[15px] font-semibold tracking-wide text-gray-900">
              {shipment.tracking_number ?? "-"}
            </p>
          </div>

          <button
            onClick={copyTracking}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 transition hover:bg-gray-50"
          >
            {copied ? (
              <Check
                size={20}
                className="text-green-600"
              />
            ) : (
              <Copy size={20} />
            )}
          </button>

          <button
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-2xl transition hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}