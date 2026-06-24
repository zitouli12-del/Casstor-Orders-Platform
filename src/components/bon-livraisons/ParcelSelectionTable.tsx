"use client";

import { createBonLivraison } from "@/src/services/bon-livraisons/createBonLivraison";
import { Parcel } from "@/src/types/Parcel";
import { useState } from "react";

interface Props {
  parcels: Parcel[];
}

export default function ParcelSelectionTable({
  parcels,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleParcel = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const handleCreateBL = async () => {
    try {
      setLoading(true);

      const result =
        await createBonLivraison(
          "ozon",
          selectedIds
        );

      setSelectedIds([]);

      console.log(
        "CREATE BL RESULT =",
        result
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="text-slate-400">
          {selectedIds.length} colis sélectionné(s)
        </div>

        <button
          onClick={handleCreateBL}
          disabled={
            selectedIds.length === 0 ||
            loading
          }
          className={`px-5 py-3 rounded-lg font-semibold ${
            selectedIds.length === 0 ||
            loading
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-cyan-600 hover:bg-cyan-500 text-white"
          }`}
        >
          {loading
            ? "Création..."
            : "Créer Bon de Livraison"}
        </button>
      </div>

      <table className="w-full">
        <thead className="bg-slate-800">
          <tr>
            <th className="p-4 text-left">
              Sélection
            </th>

            <th className="p-4 text-left">
              Tracking
            </th>

            <th className="p-4 text-left">
              Client
            </th>

            <th className="p-4 text-left">
              Ville
            </th>

            <th className="p-4 text-left">
              Prix
            </th>
          </tr>
        </thead>

        <tbody>
          {parcels.length > 0 ? (
            parcels.map((parcel) => (
              <tr
                key={parcel.id}
                className="border-t border-slate-800"
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(parcel.id)}
                    onChange={() =>
                      toggleParcel(parcel.id)
                    }
                  />
                </td>

                <td className="p-4">
                  {parcel.tracking_number}
                </td>

                <td className="p-4">
                  {parcel.orders?.name}
                </td>

                <td className="p-4">
                  {parcel.orders?.city}
                </td>

                <td className="p-4">
                  {parcel.orders?.price} DH
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={5}
                className="p-6 text-center text-slate-500"
              >
                Aucun colis en attente
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}