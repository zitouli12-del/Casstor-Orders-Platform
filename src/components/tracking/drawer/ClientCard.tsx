import {
  Home,
  MapPin,
  Phone,
  ShieldAlert,
  User,
  Truck,
  FileText,
  CircleAlert,
} from "lucide-react";

import { Shipment } from "@/src/types/Shipment";
import { BlacklistEntry } from "@/src/services/blacklist/getBlacklistEntryByPhone";
import type { ClientChange } from "@/src/types/ClientChange.ts";
import { getShippingSituationLabel } from "./statusUtils";

interface ClientCardProps {
  shipment: Shipment;
  previousClient: ClientChange | null;
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
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3 text-gray-500">
        {icon}

        <span className="text-sm font-medium">
          {label}
        </span>
      </div>

      <span
        className={`text-right font-semibold text-gray-900 ${
          isPhone ? "text-2xl" : "text-[15px]"
        }`}
      >
        {isPhone
          ? value.replace(/(\d{2})(?=\d)/g, "$1.")
          : value}
      </span>
    </div>
  );
}

export default function ClientCard({
  shipment,
  previousClient,
  blacklistEntry,
  checkingBlacklist,
}: ClientCardProps) {
  const order = shipment.orders;

  if (!order) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500">
          <User size={18} />
        </div>

        <h3 className="text-lg font-semibold uppercase text-gray-700">
          CLIENT
        </h3>
      </div>

      {/* Client information */}
      <div>
        <Row
          icon={<Phone size={18} />}
          label="Téléphone"
          value={shipment.customer_phone}
          isPhone
        />

        <Row
          icon={<MapPin size={18} />}
          label="Ville"
          value={shipment.customer_city}
        />

        <Row
          icon={<Home size={18} />}
          label="Adresse"
          value={shipment.customer_address}
        />
      </div>

      {/* Courier */}
      {(shipment.courier_name ||
        shipment.courier_phone ||
        shipment.shipping_situation ||
        shipment.shipping_note) && (
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          {/* Courier header */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Truck size={18} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                Livreur
              </p>

              <p className="text-sm font-semibold text-gray-900">
                Informations de livraison
              </p>
            </div>
          </div>

          {/* Courier information */}
          <div>
            {shipment.courier_name && (
              <Row
                icon={<User size={18} />}
                label="Nom"
                value={shipment.courier_name}
              />
            )}

            {shipment.courier_phone && (
              <Row
                icon={<Phone size={18} />}
                label="Téléphone"
                value={shipment.courier_phone}
                isPhone
              />
            )}
          </div>

          {/* Shipping situation */}
          {shipment.shipping_situation && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-white px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <CircleAlert size={17} />

                  <span className="text-sm font-medium">
                    Situation
                  </span>
                </div>

                <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-bold text-gray-800">
                  {getShippingSituationLabel(shipment.shipping_situation)}
                </span>
              </div>
            </div>
          )}

          {/* Shipping note */}
          {shipment.shipping_note && (
            <div className="mt-3 rounded-xl border border-blue-100 bg-white p-3">
              <div className="mb-2 flex items-center gap-2 text-gray-500">
                <FileText size={17} />

                <span className="text-sm font-semibold">
                  Note de livraison
                </span>
              </div>

              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                {shipment.shipping_note}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Previous client */}
      {previousClient && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <User size={18} />
            </div>

            <h4 className="text-sm font-bold uppercase tracking-wide text-amber-800">
              Client précédent
            </h4>
          </div>

          <Row
            icon={<Phone size={18} />}
            label="Téléphone"
            value={previousClient.old_customer_phone}
            isPhone
          />

          <Row
            icon={<MapPin size={18} />}
            label="Ville"
            value={previousClient.old_customer_city}
          />

          <Row
            icon={<Home size={18} />}
            label="Adresse"
            value={previousClient.old_customer_address}
          />
        </div>
      )}

      {/* Blacklist */}
      <div className="mt-5 border-t border-gray-100 pt-5">
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