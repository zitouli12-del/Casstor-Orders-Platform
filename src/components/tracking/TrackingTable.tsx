import { Eye } from "lucide-react";
import TrackingStatusBadge from "./TrackingStatusBadge";

interface TrackingTableProps {
  shipments: any[];
  loading: boolean;
  onView: (shipment: any) => void;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function TrackingTable({
  shipments,
  loading,
  onView,
}: TrackingTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full">
        <thead className="border-b bg-gray-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-6 py-4">ID</th>
            <th className="px-6 py-4">Client</th>
            <th className="px-6 py-4">Téléphone</th>
            <th className="px-6 py-4">Ville</th>
            <th className="px-6 py-4">Tracking</th>
            <th className="px-6 py-4">Statut</th>
            <th className="px-6 py-4">Dernière MAJ</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={8}
                className="py-16 text-center text-gray-500"
              >
                Chargement des expéditions...
              </td>
            </tr>
          ) : shipments.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="py-16 text-center text-gray-500"
              >
                Aucune expédition trouvée.
              </td>
            </tr>
          ) : (
            shipments.map((shipment) => (
              <tr
                key={shipment.id}
                className="border-b transition-all duration-200 hover:bg-orange-50"
              >
                <td className="px-6 py-4 font-semibold">
                  #{shipment.id}
                </td>

                <td className="px-6 py-4">
                  {shipment.orders?.name}
                </td>

                <td className="px-6 py-4">
                  {shipment.orders?.phone}
                </td>

                <td className="px-6 py-4">
                  {shipment.orders?.city}
                </td>

                <td className="px-6 py-4 font-mono text-sm">
                  {shipment.tracking_number}
                </td>

                <td className="px-6 py-4">
                  <TrackingStatusBadge
                    status={shipment.shipping_status}
                  />
                </td>

                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(shipment.updated_at)}
                </td>

                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onView(shipment)}
                    className="rounded-full p-2 text-slate-500 transition-all duration-200 hover:bg-orange-100 hover:text-orange-600"
                    title="Voir les détails"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}