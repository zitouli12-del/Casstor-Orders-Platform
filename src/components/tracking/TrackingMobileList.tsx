import {
  CalendarDays,
  Eye,
  MapPin,
  Package,
  Phone,
  Truck,
} from "lucide-react";

interface TrackingMobileListProps {
  shipments: any[];
  loading: boolean;
  onView: (shipment: any) => void;
  onExchange: (shipment: any) => void;
  onDelete: (shipment: any) => void;
}

function formatDate(date?: string | null) {
  if (!date) return "-";

  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getStatusLabel(status?: string | null) {
  if (!status) return "Inconnu";

  return status;
}

function getStatusStyle(status?: string | null) {
  const normalizedStatus = status
    ?.toLowerCase()
    .trim();

  if (
    normalizedStatus === "livré" ||
    normalizedStatus === "livre"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    normalizedStatus?.includes("annul") ||
    normalizedStatus?.includes("refus")
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    normalizedStatus?.includes("attente") ||
    normalizedStatus?.includes("ramassage")
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    normalizedStatus?.includes("livraison") ||
    normalizedStatus?.includes("cours")
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function TrackingMobileList({
  shipments,
  loading,
  onView,
  onExchange,
  onDelete,
}: TrackingMobileListProps) {
  
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 shadow-sm">
        <div className="flex items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />

          <span className="text-sm font-medium text-slate-500">
            Chargement des expéditions...
          </span>
        </div>
      </div>
    );
  }

  if (shipments.length === 0) {
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
              Aucune expédition trouvée
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Aucune expédition ne correspond aux filtres
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {shipments.map((shipment) => {
        const order = shipment?.orders;

        return (
          <article
            key={shipment.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    #{order?.id || shipment.id}
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
                      {formatDate(
                        shipment.created_at ||
                          order?.created_at
                      )}
                    </span>
                  </div>
                </div>

                {shipment.tracking_number && (
                  <p className="mt-1.5 max-w-[210px] truncate font-mono text-[11px] text-slate-400">
                    {shipment.tracking_number}
                  </p>
                )}
              </div>

              <span
                className={`inline-flex max-w-[145px] items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusStyle(
                  shipment.status
                )}`}
              >
                <span className="truncate">
                  {getStatusLabel(shipment.status)}
                </span>
              </span>
            </div>

            <div className="px-4 py-4">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="truncate text-[17px] font-bold text-slate-950">
                  {order?.name || "Client sans nom"}
                </h3>

                <a
                  href={
                    order?.phone
                      ? `tel:${order.phone.replace(/[^\d+]/g, "")}`
                      : undefined
                  }
                  aria-label={`Appeler ${order?.phone}`}
                  className="mt-2 flex items-center gap-2 rounded-md transition-colors hover:text-orange-600 active:scale-[0.98]"
                >
                  <Phone
                    size={15}
                    className="shrink-0 text-slate-400"
                  />

                  <span className="text-[15px] font-semibold tracking-wide text-slate-800">
                    {order?.phone || "-"}
                  </span>
                </a>

                <div className="mt-3 flex items-start gap-2">
                  <MapPin
                    size={15}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700">
                      {order?.city || "-"}
                    </p>

                    <p className="mt-0.5 break-words text-sm leading-5 text-slate-500">
                      {order?.address || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 py-4">
                <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                    <Truck size={13} />
                    Transporteur
                  </div>

                  <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                    {shipment.provider || "-"}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl bg-emerald-50 px-3 py-2.5">
                  <div className="text-[11px] font-medium text-emerald-500">
                    Prix
                  </div>

                  <p className="mt-1 whitespace-nowrap text-sm font-bold text-emerald-700">
                    {order?.price || 0} DH
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onView(shipment)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                aria-label={`Voir l'expédition #${
                  order?.id || shipment.id
                }`}
              >
                <Eye size={17} />
                Voir les détails
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}