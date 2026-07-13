import {
  MapPin,
  Phone,
  User,
  Home,
} from "lucide-react";

import { Shipment } from "@/src/types/Shipment";

interface ClientCardProps {
  shipment: Shipment;
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;

  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-4 last:border-0">
      <div className="flex items-center gap-3 text-gray-500">
        {icon}

        <span className="text-sm">
          {label}
        </span>
      </div>

      <span className="text-sm font-medium text-gray-900 text-right">
        {value}
      </span>
    </div>
  );
}

export default function ClientCard({
  shipment,
}: ClientCardProps) {
  const order = shipment.orders;

  if (!order) return null;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8">
      <div className="mb-8 flex items-center gap-3">
        <User
          size={20}
          className="text-violet-600"
        />

        <h3 className="text-lg font-semibold uppercase text-gray-700">
          Client
        </h3>
      </div>

      <h2 className="mb-4 text-3xl font-bold text-gray-900">
        {order.name || "-"}
      </h2>

      <Row
        icon={<Phone size={18} />}
        label="Téléphone"
        value={order.phone}
      />

      <Row
        icon={<MapPin size={18} />}
        label="Ville"
        value={order.city}
      />

      <Row
        icon={<Home size={18} />}
        label="Adresse"
        value={order.address}
      />
    </div>
  );
}