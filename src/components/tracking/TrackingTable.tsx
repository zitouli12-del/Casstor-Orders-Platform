import {
  Eye,
  RefreshCcw,
  Trash2,
} from "lucide-react";

import TrackingStatusBadge from "./TrackingStatusBadge";

interface TrackingTableProps {
  shipments: any[];
  loading: boolean;
  onView: (shipment: any) => void;
  onExchange: (shipment: any) => void;
  onDelete: (shipment: any) => void;
}

function formatSituation(situation: string) {
  switch (situation) {
    case "PAID":
      return "Payé";

    case "NOT_PAID":
      return "Non payé";

    case "INVOICED":
      return "Facturé";

    default:
      return situation || "—";
  }
}

export default function TrackingTable({
  shipments,
  loading,
  onView,
  onExchange,
  onDelete,
}: TrackingTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full">
        <thead className="border-b bg-gray-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-6 py-4">ID</th>

            <th className="px-6 py-4">
              Client
            </th>

            <th className="px-6 py-4">
              Téléphone
            </th>

            <th className="px-6 py-4">
              Ville
            </th>

            <th className="px-6 py-4">
              Tracking
            </th>

            <th className="px-6 py-4">
              Statut
            </th>

            <th className="px-6 py-4">
              Situation
            </th>

            <th className="px-6 py-4 text-center">
              Actions
            </th>
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
                {/* ID */}
                <td className="px-6 py-4 font-semibold">
                  #{shipment.id}
                </td>

                {/* CLIENT */}
                <td className="px-6 py-4">
                  {shipment.customer_name}
                </td>

                {/* TÉLÉPHONE */}
                <td className="px-6 py-4 align-top">
                  <div className="min-w-[180px]">
                    <a
                      href={`tel:${shipment.customer_phone}`}
                      className="block text-[18px] font-bold tracking-wide text-slate-800 transition-colors hover:text-orange-600"
                    >
                      {shipment.customer_phone}
                    </a>
                  </div>
                </td>

                {/* VILLE */}
                <td className="px-6 py-4">
                  {shipment.customer_city}
                </td>

                {/* TRACKING */}
                <td className="px-6 py-4 font-mono text-sm">
                  {shipment.tracking_number}
                </td>

                {/* STATUT */}
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-2">
                    <TrackingStatusBadge
                      status={shipment.shipping_status}
                    />

                    {shipment.shipment_type === "exchange" && (
                      <span className="inline-flex w-fit items-center rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
                        🔄 Échange
                      </span>
                    )}

                    {shipment.client_changed && (
                      <span className="inline-flex w-fit items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                        👤 Nouveau client
                      </span>
                    )}
                  </div>
                </td>

                {/* SITUATION */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      shipment.situation === "PAID"
                        ? "bg-green-100 text-green-700"
                        : shipment.situation === "INVOICED"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {formatSituation(
                      shipment.situation
                    )}
                  </span>
                </td>

                {/* ACTIONS */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() =>
                        onView(shipment)
                      }
                      className="rounded-full p-2 text-slate-500 transition-all duration-200 hover:bg-orange-100 hover:text-orange-600"
                      title="Voir les détails"
                    >
                      <Eye className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() =>
                        onExchange(shipment)
                      }
                      className="rounded-full p-2 text-slate-500 transition-all duration-200 hover:bg-amber-100 hover:text-amber-600"
                      title="Créer un échange"
                    >
                      <RefreshCcw className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() =>
                        onDelete(shipment)
                      }
                      className="rounded-full p-2 text-slate-500 transition-all duration-200 hover:bg-red-100 hover:text-red-600"
                      title="Supprimer l'expédition"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}