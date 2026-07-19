import {
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  User,
} from "lucide-react";

import { Shipment } from "@/src/types/Shipment";

interface Props {
  shipment: Shipment;
  onSelect: (shipment: Shipment) => void;
}

function getShipmentAge(createdAt: string) {
  const now = new Date();
  const created = new Date(createdAt);

  const diffDays = Math.floor(
    (now.getTime() - created.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) {
    return {
      label: "Aujourd'hui",
      className:
        "bg-green-100 text-green-700",
    };
  }

  if (diffDays === 1) {
    return {
      label: "Il y a 1 jour",
      className:
        "bg-green-100 text-green-700",
    };
  }

  if (diffDays <= 5) {
    return {
      label: `Il y a ${diffDays} jours`,
      className:
        "bg-yellow-100 text-yellow-700",
    };
  }

  return {
    label: `Il y a ${diffDays} jours`,
    className:
      "bg-red-100 text-red-700",
  };
}

export default function CompatibleShipmentCard({
  shipment,
  onSelect,
}: Props) {
  const shipmentAge = getShipmentAge(
    shipment.created_at
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md">
      {/* Tracking */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-orange-100 p-2">
          <Package className="h-5 w-5 text-orange-600" />
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Tracking
          </p>

          <p className="text-base font-bold tracking-wide text-slate-900">
            {shipment.tracking_number || "-"}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="mt-5 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
        <CheckCircle2 className="h-4 w-4 text-green-600" />

        <span className="text-sm font-medium text-green-700">
          {shipment.shipping_status}
        </span>
      </div>

      {/* Age */}
      <div className="mt-3 flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-slate-400" />

        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${shipmentAge.className}`}
        >
          {shipmentAge.label}
        </span>
      </div>

      {/* Client */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-slate-500" />

          <span className="text-sm">
            {shipment.customer_name || "-"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-500" />

          <span className="text-sm">
            {shipment.customer_city || "-"}
          </span>
        </div>
      </div>

      <button
        onClick={() => onSelect(shipment)}
        className="mt-6 w-full rounded-xl bg-orange-500 py-2.5 font-medium text-white transition hover:bg-orange-600"
      >
        Sélectionner ce colis
      </button>
    </div>
  );
}