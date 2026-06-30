import { Plus, Truck } from "lucide-react";

interface TransporteursHeaderProps {
  onAddProvider: () => void;
}

export default function TransporteursHeader({ onAddProvider }: TransporteursHeaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-orange-100 flex items-center justify-center">
            <Truck className="text-orange-500" size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Transporteurs
            </h1>
            <p className="text-sm text-slate-500">
              Gérez les transporteurs et leurs informations API.
            </p>
          </div>
        </div>
        <button
          onClick={onAddProvider}
          className="h-12 rounded-xl bg-orange-500 hover:bg-orange-600 px-6 text-white shadow-sm flex items-center gap-2 font-semibold"
        >
          <Plus size={20} />
          Ajouter un transporteur
        </button>
      </div>
    </div>
  );
}