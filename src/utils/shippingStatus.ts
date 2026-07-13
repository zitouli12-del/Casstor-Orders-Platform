export interface ShippingStatusConfig {
  label: string;
  badge: string;
  icon: string;
}

const STATUS_MAP: Record<string, ShippingStatusConfig> = {
  "nouveau colis": {
    label: "Nouveau colis",
    badge:
      "bg-slate-100 text-slate-700 border-slate-200",
    icon: "text-slate-600",
  },

  "expédié": {
    label: "Expédié",
    badge:
      "bg-orange-100 text-orange-700 border-orange-200",
    icon: "text-orange-600",
  },

  "mise en distribution": {
    label: "Mise en distribution",
    badge:
      "bg-blue-100 text-blue-700 border-blue-200",
    icon: "text-blue-600",
  },

  "livré": {
    label: "Livré",
    badge:
      "bg-green-100 text-green-700 border-green-200",
    icon: "text-green-600",
  },

  retour: {
    label: "Retour",
    badge:
      "bg-red-100 text-red-700 border-red-200",
    icon: "text-red-600",
  },

  refusé: {
    label: "Refusé",
    badge:
      "bg-red-100 text-red-700 border-red-200",
    icon: "text-red-600",
  },

  annulé: {
    label: "Annulé",
    badge:
      "bg-gray-100 text-gray-700 border-gray-300",
    icon: "text-gray-500",
  },
};

export function getShippingStatus(status?: string) {
  const key = status?.toLowerCase() ?? "";

  return (
    STATUS_MAP[key] ?? {
      label: status || "-",
      badge:
        "bg-gray-100 text-gray-700 border-gray-200",
      icon: "text-gray-500",
    }
  );
}