import {
  AlertTriangle,
  CalendarDays,
  Edit,
  History,
  MapPin,
  Package,
  Palette,
  Phone,
  Ruler,
  ShieldAlert,
} from "lucide-react";

import { Order } from "@/src/types/Order";
import { analyzeOrderPhoneHistory } from "@/src/services/orders/analyzeOrderPhoneHistory";
import { analyzeClientShippingHistory } from "@/src/services/tracking/analyzeClientShippingHistory";
import { BlacklistEntry } from "@/src/services/blacklist/getBlacklistEntryByPhone";
import { findBlacklistEntryByPhone } from "@/src/services/blacklist/findBlacklistEntryByPhone";

interface MobileOrdersListProps {
  filteredOrders: Order[];
  allOrders: Order[];
  allShipments: any[];
  blacklist: BlacklistEntry[];
  updatingStatus: number | null;
  handleStatusChange: (
    orderId: number,
    newStatus: string
  ) => void;
  openModal: (order: Order) => void;
  getStatusColor: (status: string) => string;
}

function getClientInsightText({
  orderCount,
  shippedCount,
  deliveredCount,
  refusedCount,
  returnedCount,
}: {
  orderCount: number;
  shippedCount: number;
  deliveredCount: number;
  refusedCount: number;
  returnedCount: number;
}) {
  if (orderCount <= 1 && shippedCount === 0) {
    return "Nouveau client · 1ère commande";
  }

  const parts: string[] = [
    `${orderCount} commandes`,
  ];

  if (shippedCount === 0) {
    parts.push("Aucun colis expédié");

    return parts.join(" · ");
  }

  if (deliveredCount > 0) {
    parts.push(
      `${deliveredCount} ${
        deliveredCount === 1 ? "livré" : "livrés"
      }`
    );
  }

  if (refusedCount > 0) {
    parts.push(
      `${refusedCount} ${
        refusedCount === 1 ? "refusé" : "refusés"
      }`
    );
  }

  if (returnedCount > 0) {
    parts.push(
      `${returnedCount} ${
        returnedCount === 1
          ? "retourné"
          : "retournés"
      }`
    );
  }

  if (
    deliveredCount === 0 &&
    refusedCount === 0 &&
    returnedCount === 0
  ) {
    parts.push(
      `${shippedCount} colis expédié${
        shippedCount > 1 ? "s" : ""
      }`
    );
  }

  return parts.join(" · ");
}

export default function MobileOrdersList({
  filteredOrders,
  allOrders,
  allShipments,
  blacklist,
  updatingStatus,
  handleStatusChange,
  openModal,
  getStatusColor,
}: MobileOrdersListProps) {
  if (filteredOrders.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="rounded-full bg-slate-50 p-4">
            <Package
              className="h-10 w-10 text-slate-300"
              strokeWidth={1.5}
            />
          </div>

          <div>
            <p className="font-semibold text-slate-700">
              Aucune commande trouvée
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Aucune commande ne correspond à votre recherche
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredOrders.map((order) => {
        const phoneHistory =
          analyzeOrderPhoneHistory(
            order,
            allOrders
          );

        const shippingHistory =
          analyzeClientShippingHistory(
            order.phone,
            allShipments
          );

        const blacklistEntry =
          findBlacklistEntryByPhone(
            order.phone,
            blacklist
          );

        const clientInsightText =
          getClientInsightText({
            orderCount: phoneHistory.orderCount,
            shippedCount:
              shippingHistory.shippedCount,
            deliveredCount:
              shippingHistory.deliveredCount,
            refusedCount:
              shippingHistory.refusedCount,
            returnedCount:
              shippingHistory.returnedCount,
          });

        return (
          <article
            key={order.id}
            className={`overflow-hidden rounded-2xl bg-white shadow-sm ${
              blacklistEntry
                ? "border border-red-200"
                : "border border-slate-200"
            }`}
          >
            <div
              className={`flex items-start justify-between gap-3 border-b px-4 py-3.5 ${
                blacklistEntry
                  ? "border-red-100 bg-red-50/40"
                  : "border-slate-100"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    #{order.id}
                  </span>

                  <span className="text-xs text-slate-300">
                    •
                  </span>

                  <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays
                      size={13}
                      className="shrink-0"
                    />

                    <span className="truncate">
                      {new Date(
                        order.created_at
                      ).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <select
                value={order.status}
                onChange={(
                  e: React.ChangeEvent<HTMLSelectElement>
                ) =>
                  handleStatusChange(
                    order.id,
                    e.target.value
                  )
                }
                disabled={updatingStatus === order.id}
                className={`max-w-[145px] rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none ${getStatusColor(
                  order.status
                )} ${
                  updatingStatus === order.id
                    ? "cursor-wait opacity-50"
                    : ""
                }`}
                aria-label={`Statut de la commande #${order.id}`}
              >
<option value="nouvelle">
  Nouvelle
</option>

<option value="confirmé">
  Confirmé
</option>

<option value="injoignable">
  Injoignable
</option>

<option value="a-rappeler">
  À rappeler
</option>

<option value="reporte">
  Reporté
</option>

<option value="annule">
  Annulé
</option>

<option value="doublon">
  Doublon
</option>

<option value="hors-confirmation">
  Hors confirmation
</option>
              </select>
            </div>

            <div className="px-4 py-4">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="truncate text-[17px] font-bold text-slate-950">
                  {order.name || "Client sans nom"}
                </h3>

                <div className="mt-2 flex items-start gap-2">
                  <Phone
                    size={15}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
<a
  href={`tel:${order.phone}`}
  className="text-[15px] font-semibold tracking-wide text-slate-800"
>
  {order.phone}
</a>

                      {blacklistEntry && (
                        <span
                          title={`Client blacklisté — ${blacklistEntry.reason}`}
                          className="inline-flex shrink-0 items-center justify-center text-red-600"
                          aria-label={`Client blacklisté — ${blacklistEntry.reason}`}
                        >
                          <ShieldAlert
                            size={16}
                            strokeWidth={2.5}
                          />
                        </span>
                      )}

                      {phoneHistory.isPossibleDuplicate && (
                        <span
                          title="Doublon possible"
                          className="inline-flex shrink-0 items-center justify-center text-amber-500"
                          aria-label="Doublon possible"
                        >
                          <AlertTriangle
                            size={15}
                            strokeWidth={2.5}
                          />
                        </span>
                      )}
                    </div>

                    <span
                      className={`mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        blacklistEntry
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-violet-200 bg-violet-50 text-violet-700"
                      }`}
                    >
                      {blacklistEntry ? (
                        <ShieldAlert
                          size={12}
                          className="shrink-0"
                        />
                      ) : (
                        <History
                          size={12}
                          className="shrink-0"
                        />
                      )}

                      <span className="truncate">
                        {blacklistEntry
                          ? `Client blacklisté · ${blacklistEntry.reason}`
                          : clientInsightText}
                      </span>
                    </span>
                  </div>
                </div>

                {blacklistEntry?.notes && (
                  <div className="mt-3 rounded-xl border border-red-100 bg-red-50/70 px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <ShieldAlert
                        size={14}
                        className="mt-0.5 shrink-0 text-red-500"
                      />

                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-red-600">
                          Note blacklist
                        </p>

                        <p className="mt-1 break-words text-xs leading-5 text-red-700">
                          {blacklistEntry.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-start gap-2">
                  <MapPin
                    size={15}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700">
                      {order.city || "-"}
                    </p>

                    <p className="mt-0.5 break-words text-sm leading-5 text-slate-500">
                      {order.address || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-4">
                <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                    <Palette size={13} />
                    Couleur
                  </div>

                  <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                    {order.color || "-"}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                    <Ruler size={13} />
                    Taille
                  </div>

                  <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                    {order.size || "-"}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl bg-emerald-50 px-3 py-2.5">
                  <div className="text-[11px] font-medium text-emerald-500">
                    Prix
                  </div>

                  <p className="mt-1 whitespace-nowrap text-sm font-bold text-emerald-700">
                    {order.price || 0} DH
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openModal(order)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label={`Modifier la commande #${order.id}`}
              >
                <Edit size={17} />

                Modifier la commande
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}