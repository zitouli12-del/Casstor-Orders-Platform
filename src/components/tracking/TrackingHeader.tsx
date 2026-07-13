import { Truck } from "lucide-react";

export default function TrackingHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
          <Truck className="h-8 w-8 text-orange-500" />
        </div>

        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Suivi des Expéditions
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Consultez et suivez toutes vos expéditions en temps réel.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm">
        <p className="text-xs text-slate-500">
          Synchronisation
        </p>

        <p className="mt-1 text-sm font-semibold text-green-600">
          ● Synchronisé
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Il y a quelques secondes
        </p>
      </div>
    </div>
  );
}