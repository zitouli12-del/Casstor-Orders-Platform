import {
  AlertTriangle,
  ChevronDown,
  Edit,
  History,
  MessageCircle,
  Package,
  ShieldAlert,
  Users,
} from "lucide-react";

import { OrderWithCompatibleShipments } from "@/src/types/OrderWithCompatibleShipments";
import { Order } from "@/src/types/Order";
import { analyzeOrderPhoneHistory } from "@/src/services/orders/analyzeOrderPhoneHistory";
import { analyzeClientShippingHistory } from "@/src/services/tracking/analyzeClientShippingHistory";
import { BlacklistEntry } from "@/src/services/blacklist/getBlacklistEntryByPhone";
import { findBlacklistEntryByPhone } from "@/src/services/blacklist/findBlacklistEntryByPhone";
import { useState } from "react";
import WhatsAppChatDrawer from "./WhatsAppChatDrawer";

interface OrdersTableProps {
  filteredOrders: OrderWithCompatibleShipments[];
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
  openChangeClientDrawer: (
    order: OrderWithCompatibleShipments
  ) => void;
}

const ORDER_STATUSES = [
  {
    value: "nouvelle",
    label: "Nouvelle",
  },
  {
    value: "confirmé",
    label: "Confirmé",
  },
  {
    value: "injoignable",
    label: "Injoignable",
  },
  {
    value: "a-rappeler",
    label: "À rappeler",
  },
  {
    value: "reporte",
    label: "Reporté",
  },
  {
    value: "annule",
    label: "Annulé",
  },
  {
    value: "doublon",
    label: "Doublon",
  },
] as const;

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

export default function OrdersTable({
  filteredOrders,
  allOrders,
  allShipments,
  blacklist,
  updatingStatus,
  handleStatusChange,
  openModal,
  getStatusColor,
  openChangeClientDrawer,
}: OrdersTableProps) {
    const [whatsappOrder, setWhatsappOrder] =
    useState<OrderWithCompatibleShipments | null>(null);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm">
              <th className="whitespace-nowrap px-6 py-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
                ID
              </th>

              <th className="whitespace-nowrap px-6 py-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Date & Heure
              </th>

              <th className="whitespace-nowrap px-6 py-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Client
              </th>

              <th className="whitespace-nowrap px-6 py-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Téléphone
              </th>

              <th className="whitespace-nowrap px-6 py-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Ville
              </th>

              <th className="whitespace-nowrap px-6 py-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Adresse
              </th>

              <th className="whitespace-nowrap px-6 py-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Couleur
              </th>

              <th className="whitespace-nowrap px-6 py-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Taille
              </th>

              <th className="whitespace-nowrap px-6 py-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Prix
              </th>

              <th className="whitespace-nowrap px-6 py-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>

              <th className="whitespace-nowrap px-6 py-5 text-center text-sm font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-6 py-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="rounded-full bg-slate-50 p-4">
                      <Package
                        className="h-12 w-12 text-slate-300"
                        strokeWidth={1.5}
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-base font-medium text-slate-700">
                        Aucune commande trouvée
                      </p>

                      <p className="text-sm text-slate-400">
                        Aucune commande ne correspond à vos
                        critères de recherche
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order, index) => {
                const phoneHistory = analyzeOrderPhoneHistory(
                  order,
                  allOrders
                );
                const shippingHistory = analyzeClientShippingHistory(
                  order.phone,
                  allShipments
                );
                const blacklistEntry = findBlacklistEntryByPhone(
                  order.phone,
                  blacklist
                );
                const clientInsightText = getClientInsightText({
                  orderCount: phoneHistory.orderCount,
                  shippedCount: shippingHistory.shippedCount,
                  deliveredCount: shippingHistory.deliveredCount,
                  refusedCount: shippingHistory.refusedCount,
                  returnedCount: shippingHistory.returnedCount,
                });

                return (
                  <tr
                    key={order.id}
                    className={`${
                      index % 2 === 0
                        ? "bg-white"
                        : "bg-slate-50/30"
                    } transition-colors duration-150 hover:bg-orange-50/50`}
                  >
                    <td className="whitespace-nowrap px-6 py-5 text-[16px] font-medium text-slate-600">
                      #{order.id}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-[16px] text-slate-600">
                      {new Date(
                        order.created_at
                      ).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>

                    <td className="px-6 py-5 align-top">
                      <div className="min-w-[180px]">
                        <span className="text-[19px] font-semibold text-slate-900">
                          {order.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5 align-top">
                      <div className="min-w-[220px]">
                        <a
                          href={`tel:${order.phone}`}
                          className="block text-[18px] font-bold tracking-wide text-slate-800 hover:text-orange-600 transition-colors"
                        >
                          {order.phone}
                        </a>

                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                              blacklistEntry
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-violet-200 bg-violet-50 text-violet-700"
                            }`}
                          >
                            {blacklistEntry ? (
                              <ShieldAlert size={12} />
                            ) : (
                              <History size={12} />
                            )}

                            {blacklistEntry
                              ? `Client blacklisté · ${blacklistEntry.reason}`
                              : clientInsightText}

                            {phoneHistory.isPossibleDuplicate && (
                              <AlertTriangle
                                size={12}
                                className="ml-1"
                              />
                            )}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-[19px] font-medium text-slate-800">
                      {order.city}
                    </td>

                    <td className="max-w-[220px] truncate px-6 py-5 text-[19px] font-medium text-slate-700">
                      {order.address || "-"}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5">
                      {order.color ? (
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-block h-4 w-4 flex-shrink-0 rounded-full border border-slate-200"
                            style={{
                              backgroundColor:
                                order.color.toLowerCase(),
                            }}
                            aria-label={`Couleur: ${order.color}`}
                          />

                          <span className="text-[19px] font-medium text-slate-700">
                            {order.color}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[19px] font-medium text-slate-400">
                          -
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-[19px] font-medium text-slate-700">
                      {order.size || "-"}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-[17px] font-semibold text-emerald-700">
                        {order.price || 0} DH
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5">
                      <div className="relative min-w-[150px]">
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
                          disabled={
                            updatingStatus === order.id
                          }
                          className={`h-9 w-full cursor-pointer appearance-none rounded-xl border px-3 pr-8 text-[14px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${getStatusColor(
                            order.status
                          )} ${
                            updatingStatus === order.id
                              ? "cursor-wait opacity-50"
                              : ""
                          }`}
                          aria-label={`Statut de la commande #${order.id}`}
                        >
                          {ORDER_STATUSES.map(
                            ({ value, label }) => (
                              <option
                                key={value}
                                value={value}
                                className="bg-white text-slate-700"
                              >
                                {label}
                              </option>
                            )
                          )}
                        </select>

                        <ChevronDown
                          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                          size={15}
                        />
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5">
                      <div className="flex items-center justify-center gap-1">
                        {order.compatibleShipments.length > 0 && (
                          <button
                            onClick={() => openChangeClientDrawer(order)}
                            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-orange-600 transition hover:bg-orange-100"
                            title="Changer le client"
                          >
                            <Users size={20} strokeWidth={2.2} />

                            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[11px] font-bold text-white shadow-sm">
                              {order.compatibleShipments.length}
                            </span>
                          </button>
                        )}

                        <button
                          onClick={() => openModal(order)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-100"
                          title="Modifier la commande"
                        >
                          <Edit size={20} strokeWidth={2.2} />
                        </button>
                        <button
  type="button"
  onClick={() => setWhatsappOrder(order)}
  className="flex h-9 w-9 items-center justify-center rounded-lg text-green-600 transition hover:bg-green-100"
  title="Ouvrir WhatsApp"
>
  <MessageCircle size={20} strokeWidth={2.2} />
</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <WhatsAppChatDrawer
        order={whatsappOrder}
        open={whatsappOrder !== null}
        onClose={() => setWhatsappOrder(null)}
      />
    </div>
  );
}