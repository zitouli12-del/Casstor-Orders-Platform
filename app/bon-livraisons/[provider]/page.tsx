import { supabase } from "@/src/lib/supabase";
import ParcelSelectionTable from "@/src/components/bon-livraisons/ParcelSelectionTable";
import { getCurrentStore } from "@/src/lib/getCurrentStore";

interface Props {
  params: Promise<{
    provider: string;
  }>;
}

export default async function ProviderPage({
  params,
}: Props) {
  const { provider } = await params;
  const store = await getCurrentStore();

  const { data: parcels, error } = await supabase
.from("shipping")
.select(`
  *,
  orders (
    id,
    name,
    city,
    price
  )
`)
.eq("store_id", store.id)
.eq("provider", provider)
.is("bon_livraison_id", null);

  const { data: bonLivraisons } = await supabase
.from("bon_livraisons")
.select("*")
.eq("store_id", store.id)
.eq("provider", provider)
    .order("created_at", {
      ascending: false,
    });

  // حساب الإحصائيات
  const colisEnAttente = parcels?.length || 0;

  const blValides =
    bonLivraisons?.filter(
      (bl) => bl.status === "validated"
    ).length || 0;

  const blImprimes =
    bonLivraisons?.filter(
      (bl) => bl.status === "printed"
    ).length || 0;

  console.log("PARCELS =", parcels);
  console.log("ERROR =", error);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Bon Livraison {provider}
          </h1>

          <p className="text-slate-400 mt-2">
            Gestion des colis et des bons de livraison.
          </p>
        </div>

        <button
          disabled
          className="
            px-5 py-3
            rounded-lg
            bg-slate-700
            text-slate-400
            font-semibold
            cursor-not-allowed
          "
        >
          Créer Bon de Livraison
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">
            Colis en attente
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {colisEnAttente}
          </h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">
            BL Validés
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {blValides}
          </h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">
            BL Imprimés
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {blImprimes}
          </h2>
        </div>
      </div>

      {/* Nouveaux Colis */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold text-lg">
            Nouveaux Colis
          </h2>
        </div>

        <ParcelSelectionTable
          parcels={parcels || []}
        />
      </div>

      {/* Historique BL */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold text-lg">
            Historique BL
          </h2>
        </div>

        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="p-4 text-left">BL Ref</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Colis</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {bonLivraisons && bonLivraisons.length > 0 ? (
              bonLivraisons.map((bl) => (
                <tr key={bl.id} className="border-t border-slate-800">
                  <td className="p-4">{bl.delivery_note_ref}</td>
                  <td className="p-4">{bl.status}</td>
                  <td className="p-4">{bl.total_colis}</td>
                  <td className="p-4">{new Date(bl.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
<div className="flex gap-3">

  <a href={`/bon-livraisons/details/${bl.id}`}>
    Voir
  </a>

  <a
    href={`/bon-livraisons/documents/pdf/${bl.id}`}
    target="_blank"
  >
    PDF
  </a>

  <a
    href={`/bon-livraisons/documents/etiquettes/${bl.id}`}
    target="_blank"
  >
    Etiquette
  </a>

  <a
    href={`/bon-livraisons/documents/etiquettes-4x4/${bl.id}`}
    target="_blank"
  >
    4x4
  </a>

</div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  Aucun bon de livraison
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}