import {
  Truck,
  CircleDollarSign,
  Package,
  CheckCircle2,
} from "lucide-react";

import { Shipment } from "@/src/types/Shipment";

interface ShipmentSummaryProps {
  shipment: Shipment;
}

export default function ShipmentSummary({
  shipment,
}: ShipmentSummaryProps) {
  const items = [
    {
      icon: CheckCircle2,
      value: shipment.shipping_status || "-",
      label: "Statut",
      iconClass: "text-green-600",
      bgClass: "bg-green-50",
    },
    {
      icon: Truck,
      value: shipment.provider || "-",
      label: "Transporteur",
      iconClass: "text-orange-500",
      bgClass: "bg-orange-50",
    },
    {
      icon: CircleDollarSign,
      value:
        shipment.parcel_price != null
          ? `${shipment.parcel_price} DH`
          : "-",
      label: "Prix",
      iconClass: "text-amber-500",
      bgClass: "bg-amber-50",
    },
    {
      icon: Package,
      value:
        shipment.parcel_size || shipment.parcel_color
          ? `${shipment.parcel_size ?? "-"} • ${
              shipment.parcel_color ?? "-"
            }`
          : "-",
      label: "Taille • Couleur",
      iconClass: "text-violet-600",
      bgClass: "bg-violet-50",
    },
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className={`flex flex-col justify-center p-8 ${
                index !== items.length - 1
                  ? "border-r border-gray-200"
                  : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${item.bgClass}`}
                >
                  <Icon
                    className={`h-7 w-7 ${item.iconClass}`}
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-xl font-semibold text-gray-900">
                    {item.value}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {item.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}