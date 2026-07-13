import {
  User,
  Phone,
  MapPin,
  MapPinned,
} from "lucide-react";

import CityAutocomplete from "../CityAutocomplete";
import { Order } from "@/src/types/Order";

interface ClientCardProps {
  editedFields: Partial<Order>;
  handleFieldChange: <K extends keyof Order>(
    field: K,
    value: Order[K]
  ) => void;
}

export default function ClientCard({
  editedFields,
  handleFieldChange,
}: ClientCardProps) {
  const inputClassName =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15";

  const labelClassName =
    "flex items-center gap-2 text-xs font-medium text-slate-500";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-6 flex items-center gap-2">
        <User size={17} className="text-violet-600" />

        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
          Client
        </h3>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className={labelClassName}>
            <User size={14} className="text-slate-400" />
            Nom complet
          </label>

          <input
            type="text"
            value={editedFields.name || ""}
            onChange={(e) =>
              handleFieldChange("name", e.target.value)
            }
            className={inputClassName}
            placeholder="Entrez le nom complet"
            aria-label="Nom complet"
          />
        </div>

        <div className="space-y-2">
          <label className={labelClassName}>
            <Phone size={14} className="text-slate-400" />
            Téléphone
          </label>

          <input
            type="text"
            value={editedFields.phone || ""}
            onChange={(e) =>
              handleFieldChange("phone", e.target.value)
            }
            className={inputClassName}
            placeholder="Entrez le numéro de téléphone"
            aria-label="Numéro de téléphone"
          />
        </div>

        <div className="space-y-2">
          <label className={labelClassName}>
            <MapPin size={14} className="text-slate-400" />
            Ville
          </label>

          <CityAutocomplete
            value={editedFields.city || ""}
            onChange={(city) =>
              handleFieldChange("city", city)
            }
          />
        </div>

        <div className="space-y-2">
          <label className={labelClassName}>
            <MapPinned size={14} className="text-slate-400" />
            Adresse
          </label>

          <input
            type="text"
            value={editedFields.address || ""}
            onChange={(e) =>
              handleFieldChange("address", e.target.value)
            }
            className={inputClassName}
            placeholder="Entrez l'adresse de livraison"
            aria-label="Adresse de livraison"
          />
        </div>
      </div>
    </section>
  );
}