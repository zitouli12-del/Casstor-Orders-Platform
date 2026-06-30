import { CalendarDays, Package, Phone, Truck } from "lucide-react";
import { Button } from "@/src/components/ui/button";

interface ConfirmationHeaderProps {
  totalOrders: number;
  onOpenShipping: () => void;
}

export default function ConfirmationHeader({
  totalOrders,
  onOpenShipping,
}: ConfirmationHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

      {/* Left */}
      <div>
        <div className="flex items-center gap-4">
          
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
         <Phone className="h-8 w-8 text-orange-500" />
         </div>
            
          <div>
            <h1 className="text-[42px] font-bold tracking-tight text-slate-900">
              Gestion des Commandes
            </h1>

            <p className="mt-2 text-base text-slate-500">
              Gérez toutes les commandes, modifiez les informations et mettez à
              jour le statut.
            </p>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col gap-3">

        <Button
          onClick={onOpenShipping}
          className="h-14 rounded-xl bg-orange-500 hover:bg-orange-600 px-8 text-[15px] font-semibold text-white shadow-sm"
        >
          <Truck className="mr-2 h-5 w-5" />
          Expédier les Commandes
        </Button>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Package className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Total commandes
              </p>

              <p className="text-4xl font-bold text-slate-900">
                {totalOrders}
              </p>
            </div>
          </div>

          {/* 
            Le bouton "Aujourd'hui" utilise maintenant le variant outline corrigé :
            - Fond blanc
            - Bordure gris clair
            - Texte slate
            - Effet hover subtil
          */}
          
           <Button
             variant="outline"
            size="sm"
            className="h-10 gap-2 px-4 text-sm font-medium"
          >   
            <CalendarDays className="h-4 w-4" />
            Aujourd'hui
          </Button>

        </div>
      </div>
    </div>
  );
}