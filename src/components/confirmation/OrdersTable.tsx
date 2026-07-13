import {
  AlertTriangle,
  ChevronDown,
  Edit,
  History,
  Package,
} from "lucide-react";

import { Order } from "@/src/types/Order";
import { analyzeOrderPhoneHistory } from "@/src/services/orders/analyzeOrderPhoneHistory";

interface OrdersTableProps {
  filteredOrders: Order[];
  allOrders: Order[];
  updatingStatus: number | null;
  handleStatusChange: (
    orderId: number,
    newStatus: string
  ) => void;
  openModal: (order: Order) => void;
  getStatusColor: (status: string) => string;
}

const statusColors: Record<string, string> = {
  nouvelle: "bg-blue-500",
  confirmé: "bg-emerald-500",
  "ps-reponse": "bg-amber-500",
  "hors-confirmation": "bg-slate-400",
};

export default function OrdersTable({
  filteredOrders,
  allOrders,
  updatingStatus,
  handleStatusChange,
  openModal,
  getStatusColor,
}: OrdersTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[650px] overflow-x-auto overflow-y-auto">
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
                const phoneHistory =
                  analyzeOrderPhoneHistory(
                    order,
                    allOrders
                  );

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

                    <td className="whitespace-nowrap px-6 py-5 text-[19px] font-semibold text-slate-900">
                      {order.name}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="text-[19px] font-semibold tracking-wide text-slate-800">
                          {order.phone}
                        </span>

                        {phoneHistory.isPossibleDuplicate ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                            <AlertTriangle size={12} />

                            Doublon possible
                          </span>
                        ) : phoneHistory.orderCount > 1 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                            <History size={12} />

                            {phoneHistory.orderCount} commandes
                          </span>
                        ) : null}
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
                      <div className="relative min-w-[130px]">
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
                          {Object.entries(statusColors).map(
                            ([status]) => (
                              <option
                                key={status}
                                value={status}
                                className="bg-white text-slate-700"
                              >
                                {status === "nouvelle" &&
                                  "● Nouvelle"}

                                {status === "confirmé" &&
                                  "● Confirmé"}

                                {status === "ps-reponse" &&
                                  "● Ps-réponse"}

                                {status ===
                                  "hors-confirmation" &&
                                  "● Hors-confirmation"}
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

                    <td className="whitespace-nowrap px-6 py-5 text-center">
                      <button
                        onClick={() => openModal(order)}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-[15px] font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        aria-label={`Modifier la commande #${order.id}`}
                      >
                        <Edit size={18} />

                        Modifier
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}