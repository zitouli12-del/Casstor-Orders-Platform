"use client";

import { useState } from "react";
import {
  Plus,
  X,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Package,
} from "lucide-react";

export interface StockVariantForm {
  id: string;
  color: string;
  size: string;
  quantity: string;
  purchase_price: string;
  imageFile: File | null;
  imagePreview: string;
}

interface AddStockProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    name: string,
    variants: StockVariantForm[]
  ) => Promise<void>;
  isAdding: boolean;
}

export default function AddStockProductModal({
  isOpen,
  onClose,
  onAdd,
  isAdding,
}: AddStockProductModalProps) {
  const [name, setName] = useState("");

  const [variants, setVariants] = useState<StockVariantForm[]>([
    {
      id: crypto.randomUUID(),
      color: "",
      size: "",
      quantity: "",
      purchase_price: "",
      imageFile: null,
      imagePreview: "",
    },
  ]);

  if (!isOpen) return null;

  function addVariant() {
    setVariants((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        color: "",
        size: "",
        quantity: "",
        purchase_price: "",
        imageFile: null,
        imagePreview: "",
      },
    ]);
  }

  function removeVariant(id: string) {
    setVariants((current) => {
      if (current.length === 1) return current;

      return current.filter((variant) => variant.id !== id);
    });
  }

  function updateVariant(
    id: string,
    field: keyof StockVariantForm,
    value: string
  ) {
    setVariants((current) =>
      current.map((variant) =>
        variant.id === id
          ? {
              ...variant,
              [field]: value,
            }
          : variant
      )
    );
  }

  function handleImageChange(
    id: string,
    file: File | null
  ) {
    if (!file) return;

    const preview = URL.createObjectURL(file);

    setVariants((current) =>
      current.map((variant) =>
        variant.id === id
          ? {
              ...variant,
              imageFile: file,
              imagePreview: preview,
            }
          : variant
      )
    );
  }

  function validate() {
    if (!name.trim()) {
      alert("Veuillez saisir le nom du modèle.");
      return false;
    }

    for (const variant of variants) {
      if (!variant.imageFile) {
        alert("Chaque variante doit avoir une photo.");
        return false;
      }

      if (!variant.color.trim()) {
        alert("Veuillez saisir la couleur de chaque variante.");
        return false;
      }

      if (!variant.size.trim()) {
        alert("Veuillez saisir la taille de chaque variante.");
        return false;
      }

      if (
        variant.quantity === "" ||
        Number(variant.quantity) < 0
      ) {
        alert("Veuillez saisir une quantité valide.");
        return false;
      }

      if (
        variant.purchase_price === "" ||
        Number(variant.purchase_price) < 0
      ) {
        alert("Veuillez saisir un prix d'achat valide.");
        return false;
      }
    }

    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;

    await onAdd(name.trim(), variants);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <Package size={20} className="text-orange-500" />
            Ajouter un modèle
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={isAdding}
            className="rounded-lg p-2 transition-colors hover:bg-slate-100"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6">

          {/* Model name */}
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Nom du modèle
              <span className="ml-1 text-orange-500">*</span>
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: ADIDAS01"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>

          {/* Variants title */}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Variantes
              </h3>

              <p className="mt-0.5 text-xs text-slate-400">
                Chaque combinaison couleur / taille possède sa propre photo.
              </p>
            </div>

            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-600 transition-colors hover:bg-orange-100"
            >
              <Plus size={15} />
              Ajouter une variante
            </button>
          </div>

          {/* Variants */}
          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div
                key={variant.id}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    Variante #{index + 1}
                  </span>

                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[120px_1fr_1fr_110px_140px]">

                  {/* Photo */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Photo
                      <span className="ml-1 text-orange-500">*</span>
                    </label>

                    <label className="group flex h-[92px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white transition-colors hover:border-orange-400">
                      {variant.imagePreview ? (
                        <img
                          src={variant.imagePreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                          <ImageIcon size={22} />
                          <span className="text-[10px]">
                            Ajouter
                          </span>
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageChange(
                            variant.id,
                            e.target.files?.[0] || null
                          )
                        }
                      />
                    </label>
                  </div>

                  {/* Couleur */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Couleur
                      <span className="ml-1 text-orange-500">*</span>
                    </label>

                    <input
                      type="text"
                      value={variant.color}
                      onChange={(e) =>
                        updateVariant(
                          variant.id,
                          "color",
                          e.target.value
                        )
                      }
                      placeholder="Ex: Noir"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  </div>

                  {/* Taille */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Taille
                      <span className="ml-1 text-orange-500">*</span>
                    </label>

                    <input
                      type="text"
                      value={variant.size}
                      onChange={(e) =>
                        updateVariant(
                          variant.id,
                          "size",
                          e.target.value
                        )
                      }
                      placeholder="Ex: XL"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  </div>

                  {/* Quantité */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Quantité
                      <span className="ml-1 text-orange-500">*</span>
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={variant.quantity}
                      onChange={(e) =>
                        updateVariant(
                          variant.id,
                          "quantity",
                          e.target.value
                        )
                      }
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  </div>

                  {/* Prix */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Prix d'achat (DH)
                      <span className="ml-1 text-orange-500">*</span>
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={variant.purchase_price}
                      onChange={(e) =>
                        updateVariant(
                          variant.id,
                          "purchase_price",
                          e.target.value
                        )
                      }
                      placeholder="100"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isAdding}
            className="rounded-xl bg-slate-100 px-6 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isAdding}
            className={`flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-orange-600 ${
              isAdding
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
          >
            {isAdding ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}

            {isAdding ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}