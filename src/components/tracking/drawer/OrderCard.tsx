import { Package } from "lucide-react";

import { Shipment } from "@/src/types/Shipment";

interface OrderCardProps {
  shipment: Shipment;
}

interface RowProps {
  label: string;
  value?: string | number | null;
}

function Row({
  label,
  value,
}: RowProps) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <div className="flex items-center border-b border-gray-100 py-4 last:border-0">
      <span className="w-40 shrink-0 text-sm text-gray-500">
        {label}
      </span>

      <span className="flex-1 text-right text-sm font-medium text-gray-900">
        {value}
      </span>
    </div>
  );
}

export default function OrderCard({
  shipment,
}: OrderCardProps) {
  const order = shipment.orders;

  if (!order) return null;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8">
      <div className="mb-8 flex items-center gap-3">
        <Package
          size={20}
          className="text-orange-500"
        />

        <h3 className="text-lg font-semibold uppercase tracking-wider text-gray-700">
          Commande
        </h3>
      </div>

      <h2 className="mb-8 text-3xl font-bold leading-tight text-gray-900">
        {order.product}
      </h2>

      <div>
        <Row
          label="Date de commande"
          value={new Date(
            order.created_at
          ).toLocaleString("fr-FR")}
        />

        <Row
          label="Taille"
          value={order.size}
        />

        <Row
          label="Couleur"
          value={order.color}
        />

        <Row
          label="Prix"
          value={
            order.price != null
              ? `${order.price} DH`
              : null
          }
        />

        {order.source && (
          <Row
            label="Source"
            value={order.source}
          />
        )}
      </div>
    </div>
  );
}