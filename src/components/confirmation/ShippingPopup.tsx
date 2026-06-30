import {
  X,
  Truck,
  Package,
  CheckSquare,
  Square,
  CheckCircle2,
  MapPin,
  Hash,
  Building2,
  CircleCheck,
  ShoppingBag,
} from "lucide-react";
import { Order } from "@/src/types/Order";

interface ShippingPopupProps {
  isOpen: boolean;
  confirmedOrders: Order[];
  selectedShippingOrders: string[];
  selectedCarrier: "ozon" | "olivraison";
  setSelectedCarrier: (carrier: "ozon" | "olivraison") => void;
  toggleOrderSelection: (orderId: string) => void;
  toggleAllOrders: () => void;
  handleShipOrders: () => void;
  closeShippingPopup: () => void;
}

export default function ShippingPopup({
  isOpen,
  confirmedOrders,
  selectedShippingOrders,
  selectedCarrier,
  setSelectedCarrier,
  toggleOrderSelection,
  toggleAllOrders,
  handleShipOrders,
  closeShippingPopup,
}: ShippingPopupProps) {
  if (!isOpen) return null;

  const allSelected =
    confirmedOrders.length > 0 &&
    confirmedOrders.every((order) =>
      selectedShippingOrders.includes(String(order.id))
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && closeShippingPopup()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shipping-dialog-title"
    >
      <div className="bg-white rounded-3xl shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-8 py-6 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-50 rounded-2xl">
                <Truck size={24} className="text-orange-500" />
              </div>
              <div>
                <h2
                  id="shipping-dialog-title"
                  className="text-2xl font-semibold text-slate-900 tracking-tight"
                >
                  Expédier les commandes
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Commandes confirmées prêtes à l&apos;expédition
                </p>
              </div>
            </div>
            <button
              onClick={closeShippingPopup}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Fermer le dialogue"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8">
          {/* Statistics Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-6 border border-blue-100/50">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white rounded-2xl shadow-sm">
                <Package size={28} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Commandes confirmées
                </p>
                <p className="text-4xl font-bold text-slate-900 tracking-tight">
                  {confirmedOrders.length}
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Prêtes pour l&apos;expédition
                </p>
              </div>
            </div>
          </div>

          {/* Select All */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <button
              onClick={toggleAllOrders}
              className="flex items-center gap-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              aria-label={allSelected ? "Désélectionner tout" : "Sélectionner tout"}
            >
              {allSelected ? (
                <CheckSquare size={20} className="text-blue-600" />
              ) : (
                <Square size={20} className="text-slate-400" />
              )}
              Tout sélectionner
            </button>
            <span className="text-sm text-slate-500">
              {selectedShippingOrders.length} sélectionnée
              {selectedShippingOrders.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Orders List */}
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
            {confirmedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="p-6 bg-slate-100 rounded-full mb-4">
                  <ShoppingBag size={48} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">
                  Aucune commande confirmée
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1">
                  Les commandes confirmées et prêtes à être expédiées
                  apparaîtront ici
                </p>
              </div>
            ) : (
              confirmedOrders.map((order) => {
                const orderId = String(order.id);
                const isSelected = selectedShippingOrders.includes(orderId);
                return (
                  <div
                    key={order.id}
                    className={`group flex items-center gap-4 p-4 bg-white border rounded-xl transition-all cursor-pointer hover:shadow-md ${
                      isSelected
                        ? "border-orange-400 shadow-sm ring-1 ring-orange-400/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    onClick={() => toggleOrderSelection(orderId)}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleOrderSelection(orderId);
                      }
                    }}
                  >
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckCircle2 size={22} className="text-orange-500" />
                      ) : (
                        <div className="w-5.5 h-5.5 border-2 border-slate-300 rounded-md group-hover:border-slate-400 transition-colors" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-slate-900 truncate">
                          {order.name}
                        </span>
                        <span className="text-slate-400">•</span>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <MapPin size={14} className="text-slate-400" />
                          <span>{order.city}</span>
                        </div>
                        <span className="text-slate-400">•</span>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Hash size={14} className="text-slate-400" />
                          <span className="font-mono text-xs">#{orderId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-sm border border-emerald-100">
                        {order.price || 0} DH
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Carrier Selection */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">
              Sélectionner le transporteur
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedCarrier === "ozon"
                    ? "border-orange-400 bg-orange-50/50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => setSelectedCarrier("ozon")}
                role="radio"
                aria-checked={selectedCarrier === "ozon"}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedCarrier("ozon");
                  }
                }}
              >
                {selectedCarrier === "ozon" && (
                  <div className="absolute top-3 right-3">
                    <CircleCheck size={20} className="text-orange-500" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Building2 size={20} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Ozon Express</p>
                    <p className="text-xs text-slate-500">Livraison rapide</p>
                  </div>
                </div>
              </div>

              <div
                className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedCarrier === "olivraison"
                    ? "border-orange-400 bg-orange-50/50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => setSelectedCarrier("olivraison")}
                role="radio"
                aria-checked={selectedCarrier === "olivraison"}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedCarrier("olivraison");
                  }
                }}
              >
                {selectedCarrier === "olivraison" && (
                  <div className="absolute top-3 right-3">
                    <CircleCheck size={20} className="text-orange-500" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Truck size={20} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Olivraison</p>
                    <p className="text-xs text-slate-500">Livraison standard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/70 rounded-xl p-5 border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Commandes sélectionnées
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedShippingOrders.length}
                  </p>
                </div>
                <div className="w-px h-10 bg-slate-300" />
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Transporteur
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    {selectedCarrier === "ozon" ? "Ozon Express" : "Olivraison"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <span className="text-sm font-medium text-slate-700">
                  Prêt pour l&apos;expédition
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm px-8 py-5 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3 rounded-b-3xl">
          <button
            onClick={closeShippingPopup}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleShipOrders}
            disabled={selectedShippingOrders.length === 0}
            className={`px-8 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-sm ${
              selectedShippingOrders.length === 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            <Truck size={18} />
            Expédier
          </button>
        </div>
      </div>
    </div>
  );
}