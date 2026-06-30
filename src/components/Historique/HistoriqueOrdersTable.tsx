import { Package } from "lucide-react";

interface HistoriqueOrdersTableProps {
  orders: any[];
}

export default function HistoriqueOrdersTable({ orders }: HistoriqueOrdersTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                ID
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Date & Heure
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Client
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Téléphone
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Ville
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Produit
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Source
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap text-right">
                Prix
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                      <Package size={32} />
                    </div>
                    <p className="text-lg font-semibold text-slate-900">
                      Aucune commande trouvée
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Aucune commande ne correspond à votre recherche.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order, index) => (
                <tr
                  key={order.id}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                  } hover:bg-slate-100 transition-colors`}
                >
                  <td className="px-6 py-4 text-sm font-mono text-slate-500 whitespace-nowrap">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                    {new Date(order.created_at).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">
                    {order.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                    {order.phone}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                    {order.city}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                    {order.product || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                    {order.source || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600 whitespace-nowrap text-right">
                    {order.price || 0} DH
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