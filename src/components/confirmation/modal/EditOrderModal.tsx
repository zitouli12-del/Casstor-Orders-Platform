import { X, Edit, Hash, Calendar, Clock, User, Phone, MapPin, Tag, Palette, Maximize2, CreditCard, Globe, FileText, Save } from "lucide-react";
import CityAutocomplete from "../CityAutocomplete";
import { Order } from "@/src/types/Order";

interface EditOrderModalProps {
  isOpen: boolean;
  selectedOrder: Order | null;
  editedFields: Partial<Order>;
  isSaving: boolean;
  handleFieldChange: <K extends keyof Order>(field: K, value: Order[K]) => void;
  handleSave: () => void;
  closeModal: () => void;
}

export default function EditOrderModal({
  isOpen,
  selectedOrder,
  editedFields,
  isSaving,
  handleFieldChange,
  handleSave,
  closeModal
}: EditOrderModalProps) {
  if (!isOpen || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200/60 transition-all duration-200">
        {/* Modal Header */}
        <div className="bg-white/95 backdrop-blur-sm px-8 py-6 border-b border-slate-200 sticky top-0 z-10">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <Edit size={20} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Modifier la commande
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3 pl-[52px]">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-700">
                  <Hash size={14} className="text-slate-500" />
                  #{selectedOrder.id}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-sm text-slate-500 flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" />
                  Créée le {new Date(selectedOrder.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                </span>
                {selectedOrder.updated_at && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-sm text-slate-500 flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-400" />
                      Mise à jour le {new Date(selectedOrder.updated_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:ring-offset-2"
              aria-label="Fermer le dialogue"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <User size={16} className="text-slate-500" />
                Nom complet
              </label>
              <input
                type="text"
                value={editedFields.name || ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 text-sm"
                placeholder="Entrez le nom complet"
                aria-label="Nom complet"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Phone size={16} className="text-slate-500" />
                Téléphone
              </label>
              <input
                type="text"
                value={editedFields.phone || ""}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 text-sm"
                placeholder="Entrez le numéro de téléphone"
                aria-label="Numéro de téléphone"
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <MapPin size={16} className="text-slate-500" />
                Ville
              </label>
              <CityAutocomplete
                value={editedFields.city || ""}
                onChange={(city) => handleFieldChange("city", city)}
              />
            </div>

            {/* Product - Read-only */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Tag size={16} className="text-slate-500" />
                Produit
              </label>
              <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm flex items-center">
                <span className="font-medium">{selectedOrder.product || "—"}</span>
              </div>
            </div>

            {/* Color */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Palette size={16} className="text-slate-500" />
                Couleur
              </label>
              <input
                type="text"
                value={editedFields.color || ""}
                onChange={(e) => handleFieldChange("color", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 text-sm"
                placeholder="Entrez la couleur"
                aria-label="Couleur"
              />
            </div>

            {/* Size */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Maximize2 size={16} className="text-slate-500" />
                Taille
              </label>
              <input
                type="text"
                value={editedFields.size || ""}
                onChange={(e) => handleFieldChange("size", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 text-sm"
                placeholder="Entrez la taille"
                aria-label="Taille"
              />
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <CreditCard size={16} className="text-slate-500" />
                Prix
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={editedFields.price ?? ""}
                onChange={(e) => handleFieldChange("price", e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 text-sm"
                placeholder="Entrez le prix"
                aria-label="Prix"
              />
            </div>

            {/* Source - Read-only */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Globe size={16} className="text-slate-500" />
                Source
              </label>
              <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm flex items-center">
                <span className="font-medium">{selectedOrder.source || "—"}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <FileText size={16} className="text-slate-500" />
                Notes
              </label>
              <textarea
                value={editedFields.notes || ""}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 text-sm resize-none"
                placeholder="Ajouter des notes..."
                aria-label="Notes"
              />
            </div>

            {/* Commentaire Livreur */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <FileText size={16} className="text-slate-500" />
                Commentaire Livreur
              </label>
              <textarea
                value={editedFields.livreur_comment || ""}
                onChange={(e) => handleFieldChange("livreur_comment", e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 text-sm resize-none"
                placeholder="Instructions pour le livreur..."
                aria-label="Commentaire livreur"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white/95 backdrop-blur-sm px-8 py-5 border-t border-slate-200 sticky bottom-0">
          <div className="flex flex-wrap gap-3 justify-end">
            <button
              onClick={closeModal}
              className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:ring-offset-2"
              aria-label="Annuler les modifications"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 text-sm shadow-sm shadow-blue-600/20 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:ring-offset-2"
              aria-label="Enregistrer les modifications"
            >
              <Save size={18} />
              {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}