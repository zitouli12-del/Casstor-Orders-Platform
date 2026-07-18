"use client";

import { createBonLivraison } from "@/src/services/bon-livraisons/createBonLivraison";
import { Parcel } from "@/src/types/Parcel";
import { useState } from "react";
import {
  PackageCheck,
  Loader2,
  Package,
  MapPin
} from "lucide-react";

interface Props {
  parcels: Parcel[];
}

export default function ParcelSelectionTable({
  parcels,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const allSelected =
    parcels.length > 0 &&
    selectedIds.length === parcels.length;

  const toggleParcel = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(
        parcels.map((parcel) => parcel.id)
      );
    }
  };

  const handleCreateBL = async () => {
    console.log("BUTTON CLICKED");
    console.log("selectedIds =", selectedIds);

    try {
      setLoading(true);

      console.log("Before fetch");

      const result = await createBonLivraison("ozon", selectedIds);

      console.log("After fetch");
      console.log(result);

      setSelectedIds([]);
    } catch (error) {
      console.error("ERROR =", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 px-6 py-4 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2 text-sm font-medium">
          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
              <PackageCheck className="w-4 h-4" />
              <span>{selectedIds.length} colis sélectionné(s)</span>
            </div>
          ) : (
            <span className="text-slate-500">Aucun colis sélectionné</span>
          )}
        </div>

        <button
          onClick={handleCreateBL}
          disabled={selectedIds.length === 0 || loading}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm ${
            selectedIds.length === 0 || loading
              ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              : "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200 hover:shadow-orange-300"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Création...
            </>
          ) : (
            "Créer Bon de Livraison"
          )}
        </button>
      </div>

      {/* Table Wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <span>Sélection</span>
                </div>
              </th>
              <th className="p-4">Tracking</th>
              <th className="p-4">Client</th>
              <th className="p-4">Ville</th>
              <th className="p-4">Prix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {parcels.length > 0 ? (
              parcels.map((parcel) => {
                const isSelected = selectedIds.includes(parcel.id);
                return (
                  <tr
                    key={parcel.id}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-orange-50/50 hover:bg-orange-50/80"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleParcel(parcel.id)}
                        className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 font-mono font-medium text-slate-700">
                      {parcel.tracking_number}
                    </td>
                    <td className="p-4 font-medium text-slate-900">
                      {parcel.orders?.name}
                    </td>
                    <td className="p-4 text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {parcel.orders?.city}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                        {parcel.orders?.price} DH
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="p-12 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Package className="w-8 h-8 opacity-20" />
                    <p>Aucun colis en attente</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}