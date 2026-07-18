import { supabase } from "@/src/lib/supabase";
import ParcelSelectionTable from "@/src/components/bon-livraisons/ParcelSelectionTable";
import { getCurrentStore } from "@/src/lib/getCurrentStore";
import {
  Package,
  FileText,
  Truck,
  CheckCircle,
  Tag,
  LayoutGrid,
  History,
  PackagePlus,
  Files,
} from "lucide-react";

interface Props {
  params: Promise<{
    provider: string;
  }>;
}

export default async function ProviderPage({ params }: Props) {
  const { provider } = await params;
  const store = await getCurrentStore();

  const { data: parcels } = await supabase
    .from("shipping")
    .select(`*, orders (id, name, city, price)`)
    .eq("store_id", store.id)
    .eq("provider", provider)
    .is("bon_livraison_id", null);

  const { data: bonLivraisons } = await supabase
    .from("bon_livraisons")
    .select("*")
    .eq("store_id", store.id)
    .eq("provider", provider)
    .order("created_at", { ascending: false });

  const colisEnAttente = parcels?.length || 0;
  const blValides = bonLivraisons?.filter((bl) => bl.status === "validated").length || 0;
  const totalBL = bonLivraisons?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-orange-600 rounded-2xl text-white shadow-lg shadow-orange-200">
            <Truck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bons de Livraison</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                {provider}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">Gestion logistique des colis et documents.</p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Colis en attente", value: colisEnAttente, icon: Package, color: "text-orange-600", bg: "bg-orange-50", border: "border-l-4 border-l-orange-500" },
          { label: "BL Validés", value: blValides, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-l-4 border-l-emerald-500" },
          { label: "Total BL", value: totalBL, icon: Files, color: "text-blue-600", bg: "bg-blue-50", border: "border-l-4 border-l-blue-500" },
        ].map((stat, i) => (
          <div key={i} className={`bg-white border border-slate-200 ${stat.border} rounded-2xl p-6 shadow-sm flex items-center justify-between`}>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h2 className="text-4xl font-extrabold text-slate-900 mt-2">{stat.value}</h2>
            </div>
            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={28} />
            </div>
          </div>
        ))}
      </section>

      {/* Nouveaux Colis */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
            <PackagePlus size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Nouveaux Colis</h2>
            <p className="text-xs text-slate-500">Sélectionnez les colis à inclure dans un bon de livraison.</p>
          </div>
        </div>
        <ParcelSelectionTable parcels={parcels || []} />
      </section>

      {/* Historique BL */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
            <History size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Historique BL</h2>
            <p className="text-xs text-slate-500">Consultez et gérez vos bons de livraison créés.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-[11px]">BL REF</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Colis</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Date</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bonLivraisons && bonLivraisons.length > 0 ? (
                bonLivraisons.map((bl) => (
                  <tr key={bl.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">{bl.delivery_note_ref}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        bl.status === 'validated' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 
                        bl.status === 'printed' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {bl.status === 'validated' ? 'Validé' : bl.status === 'printed' ? 'Imprimé' : bl.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {bl.total_colis}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{new Date(bl.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5">
                        <a href={`/bon-livraisons/documents/pdf/${bl.id}`} target="_blank" title="PDF Bon de Livraison" aria-label="PDF Bon de Livraison" className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><FileText size={16} /></a>
                        <a href={`/bon-livraisons/documents/etiquettes/${bl.id}`} target="_blank" title="Étiquettes" aria-label="Étiquettes" className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"><Tag size={16} /></a>
                        <a href={`/bon-livraisons/documents/etiquettes-4x4/${bl.id}`} target="_blank" title="Étiquettes 4×4" aria-label="Étiquettes 4×4" className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"><LayoutGrid size={16} /></a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                    <FileText size={40} className="mx-auto mb-3 text-slate-200" />
                    Aucun historique de bon de livraison trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}