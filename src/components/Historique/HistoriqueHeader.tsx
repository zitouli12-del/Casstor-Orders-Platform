import { History, BarChart3 } from "lucide-react";

interface HistoriqueHeaderProps {
  totalResults: number;
}

export default function HistoriqueHeader({ totalResults }: HistoriqueHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
      {/* Left section */}
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
          <History size={28} />
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Historique des Commandes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consultez toutes les commandes enregistrées dans la base de données.
          </p>
        </div>
      </div>

      {/* Right section - Stats card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-5 py-4 flex items-center gap-4 shrink-0">
        <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
          <BarChart3 size={20} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">
            Commandes trouvées
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {totalResults}
          </p>
        </div>
      </div>
    </div>
  );
}