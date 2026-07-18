import {
  Home,
  MapPin,
  Phone,
  ShieldAlert,
  User,
} from "lucide-react";

import { Shipment } from "@/src/types/Shipment";
import { BlacklistEntry } from "@/src/services/blacklist/getBlacklistEntryByPhone";

interface ClientCardProps {
  shipment: Shipment;
  blacklistEntry: BlacklistEntry | null;
  checkingBlacklist: boolean;
  onAddToBlacklist: () => void;
}

function Row({
  icon,
  label,
  value,
  isPhone = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  isPhone?: boolean;
}) {
  if (!value) return null;

  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-4 last:border-0">
      <div className="flex items-center gap-3 text-gray-500">
        {icon}
        <span className="text-[15px]">{label}</span>
      </div>

      <span className={`text-right font-semibold text-gray-900 ${isPhone ? "text-2xl" : "text-[15px]"}`}>
        {isPhone ? value.replace(/(\d{2})(?=\d)/g, '$1.') : value}
      </span>
    </div>
  );
}

export default function ClientCard({
  shipment,
  blacklistEntry,
  checkingBlacklist,
}: ClientCardProps) {
  const order = shipment.orders;

  if (!order) return null;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-8">
      <div className="mb-8 flex items-center gap-3">
        <User
          size={20}
          className="text-violet-600"
        />

        <h3 className="text-lg font-semibold uppercase text-gray-700">
          CLIENT
        </h3>
      </div>

      <h2 className="mb-5 text-[34px] font-bold text-gray-900">
        {order.name || "-"}
      </h2>

      <div>
        <Row
          icon={<Phone size={18} />}
          label="Téléphone"
          value={order.phone}
          isPhone={true}
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

      <div className="mt-auto border-t border-gray-100 pt-5">
        {checkingBlacklist ? (
          <div className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-500">
            Vérification de la blacklist...
          </div>
        ) : blacklistEntry ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <ShieldAlert size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-red-800">
                  Client blacklisté
                </p>

                <p className="mt-1 break-words text-sm font-medium text-red-700">
                  {blacklistEntry.reason}
                </p>

                {blacklistEntry.notes && (
                  <p className="mt-2 break-words text-xs leading-5 text-red-600/80">
                    {blacklistEntry.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}