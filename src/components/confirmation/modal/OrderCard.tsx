import {
  Package,
  Tag,
  Palette,
  Maximize2,
  CreditCard,
  Globe,
} from "lucide-react";

import { Order } from "@/src/types/Order";

interface OrderCardProps {
  selectedOrder: Order;
  editedFields: Partial<Order>;
  handleFieldChange: <K extends keyof Order>(
    field: K,
    value: Order[K]
  ) => void;
}

export default function OrderCard({
  selectedOrder,
  editedFields,
  handleFieldChange,
}: OrderCardProps) {
  const inputClassName =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15";

  const labelClassName =
    "flex items-center gap-2 text-xs font-medium text-slate-500";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-6 flex items-center gap-2">
        <Package size={17} className="text-orange-500" />

        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
          Commande
        </h3>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className={labelClassName}>
            <Tag size={14} className="text-slate-400" />
            Produit
          </label>

          <div className="flex min-h-[42px] items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
            <span className="font-medium">
              {selectedOrder.product || "—"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={labelClassName}>
              <Palette size={14} className="text-slate-400" />
              Couleur
            </label>

            <input
              type="text"
              value={editedFields.color || ""}
              onChange={(e) =>
                handleFieldChange("color", e.target.value)
              }
              className={inputClassName}
              placeholder="Couleur"
              aria-label="Couleur"
            />
          </div>

          <div className="space-y-2">
            <label className={labelClassName}>
              <Maximize2 size={14} className="text-slate-400" />
              Taille
            </label>

            <input
              type="text"
              value={editedFields.size || ""}
              onChange={(e) =>
                handleFieldChange("size", e.target.value)
              }
              className={inputClassName}
              placeholder="Taille"
              aria-label="Taille"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClassName}>
            <CreditCard size={14} className="text-slate-400" />
            Prix
          </label>

          <div className="relative">
            <input
              type="number"
              step="1"
              min="0"
              value={editedFields.price ?? ""}
              onChange={(e) =>
                handleFieldChange(
                  "price",
                  e.target.value
                    ? Number(e.target.value)
                    : null
                )
              }
              className={`${inputClassName} pr-16`}
              placeholder="Prix"
              aria-label="Prix"
            />

            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-semibold text-slate-400">
              DH
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClassName}>
            <Globe size={14} className="text-slate-400" />
            Source
          </label>

          <div className="flex min-h-[42px] items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900">
            <span className="font-medium">
              {selectedOrder.source || "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}