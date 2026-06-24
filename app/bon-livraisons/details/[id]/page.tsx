import { supabase } from "@/src/lib/supabase";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function BLDetailsPage({ params }: Props) {
  const { id } = await params;

  const [blResponse, parcelsResponse] = await Promise.all([
    supabase.from("bon_livraisons").select("*").eq("id", id).single(),
    supabase
      .from("shipping")
      .select(`
        *,
        orders (
          id,
          name,
          phone,
          city,
          price
        )
      `)
      .eq("bon_livraison_id", id),
  ]);

  if (blResponse.error || !blResponse.data) {
    notFound();
  }

  const bl = blResponse.data;
  const parcels = parcelsResponse.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Bon Livraison</h1>
          <p className="text-slate-400 mt-2">{bl.delivery_note_ref}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <p className="text-slate-400 text-sm">Nombre de colis</p>
        <h2 className="text-3xl font-bold mt-2">{parcels.length}</h2>
      </div>

      <div className="flex gap-3 justify-end">
        <a
          href={`/bon-livraisons/pdf/${bl.id}`}
          className="
            px-4 py-2
            bg-cyan-600
            hover:bg-cyan-700
            rounded-lg
            font-medium
          "
        >
          Voir PDF BL
        </a>

        <a
          href={`/bon-livraisons/etiquettes/${bl.id}`}
          className="
            px-4 py-2
            bg-emerald-600
            hover:bg-emerald-700
            rounded-lg
            font-medium
          "
        >
          Voir Étiquettes
        </a>

        <a
          href={`/bon-livraisons/etiquettes-4x4/${bl.id}`}
          className="
            px-4 py-2
            bg-orange-600
            hover:bg-orange-700
            rounded-lg
            font-medium
          "
        >
          Étiquettes 4×4
        </a>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="p-4 text-left">Tracking</th>
              <th className="p-4 text-left">Client</th>
              <th className="p-4 text-left">Téléphone</th>
              <th className="p-4 text-left">Ville</th>
              <th className="p-4 text-left">Prix</th>
            </tr>
          </thead>
          <tbody>
            {parcels.map((parcel) => (
              <tr key={parcel.id} className="border-t border-slate-800">
                <td className="p-4">{parcel.tracking_number}</td>
                <td className="p-4">{parcel.orders?.name || "N/A"}</td>
                <td className="p-4">{parcel.orders?.phone || "N/A"}</td>
                <td className="p-4">{parcel.orders?.city || "N/A"}</td>
                <td className="p-4">{parcel.orders?.price || 0} DH</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}