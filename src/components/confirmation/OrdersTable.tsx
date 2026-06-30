import { ChevronDown, Edit, Package } from "lucide-react";
import { Order } from "@/src/types/Order";

interface OrdersTableProps {
  filteredOrders: Order[];
  updatingStatus: number | null;
  handleStatusChange: (orderId: number, newStatus: string) => void;
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
  updatingStatus,
  handleStatusChange,
  openModal,
  getStatusColor,
}: OrdersTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200">
              <th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                ID
              </th>
              <th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Date & Heure
              </th>
              <th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Client
              </th>
              <th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Téléphone
              </th>
              <th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Ville
              </th>
              <th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Adresse
              </th>
              <th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Couleur
              </th>
              <th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Taille
              </th>
              <th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Prix
              </th>
              <th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <th className="px-6 py-5 text-sm font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap text-center">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="p-4 bg-slate-50 rounded-full">
                      <Package className="w-12 h-12 text-slate-300" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-medium text-slate-700">Aucune commande trouvée</p>
                      <p className="text-sm text-slate-400">
                        Aucune commande ne correspond à vos critères de recherche
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order, index) => (
                <tr
                  key={order.id}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  } hover:bg-orange-50/50 transition-colors duration-150`}
                >
                  <td className="px-6 py-5 text-[16px] text-slate-600 whitespace-nowrap font-medium">
                    #{order.id}
                  </td>

                  <td className="px-6 py-5 text-[16px] text-slate-600 whitespace-nowrap">
                    {new Date(order.created_at).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>

                  <td className="px-6 py-5 text-[19px] font-semibold text-slate-900 whitespace-nowrap">
                    {order.name}
                  </td>

                  <td className="px-6 py-5 text-[19px] font-semibold text-slate-800 tracking-wide whitespace-nowrap">
                    {order.phone}
                  </td>

                  <td className="px-6 py-5 text-[19px] font-medium text-slate-800 whitespace-nowrap">
                    {order.city}
                  </td>

                  <td className="px-6 py-5 text-[19px] font-medium text-slate-700 max-w-[220px] truncate">
                    {order.address || "-"}
                  </td>

                  <td className="px-6 py-5 whitespace-nowrap">
                    {order.color ? (
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-block w-4 h-4 rounded-full border border-slate-200 flex-shrink-0"
                          style={{
                            backgroundColor: order.color.toLowerCase(),
                          }}
                          aria-label={`Couleur: ${order.color}`}
                        />
                        <span className="text-[19px] font-medium text-slate-700">
                          {order.color}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[19px] font-medium text-slate-400">-</span>
                    )}
                  </td>

                  <td className="px-6 py-5 text-[19px] font-medium text-slate-700 whitespace-nowrap">
                    {order.size || "-"}
                  </td>

                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="inline-flex items-center px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[17px] font-semibold">
                      {order.price || 0} DH
                    </span>
                  </td>

                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="relative min-w-[130px]">
                      <select
                        value={order.status}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        disabled={updatingStatus === order.id}
                        className={`w-full h-9 px-3 pr-8 rounded-xl border text-[14px] font-medium appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                          getStatusColor(order.status)
                        } ${
                          updatingStatus === order.id
                            ? "opacity-50 cursor-wait"
                            : ""
                        }`}
                        aria-label={`Statut de la commande #${order.id}`}
                      >
                        {Object.entries(statusColors).map(([status, color]) => (
                          <option
                            key={status}
                            value={status}
                            className="bg-white text-slate-700"
                          >
                            {status === "nouvelle" && "● Nouvelle"}
                            {status === "confirmé" && "● Confirmé"}
                            {status === "ps-reponse" && "● Ps-réponse"}
                            {status === "hors-confirmation" && "● Hors-confirmation"}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        size={15}
                      />
                    </div>
                  </td>

                  <td className="px-6 py-5 text-center whitespace-nowrap">
                    <button
                      onClick={() => openModal(order)}
                      className="inline-flex items-center gap-2 h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      aria-label={`Modifier la commande #${order.id}`}
                    >
                      <Edit size={18} />
                      Modifier
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}