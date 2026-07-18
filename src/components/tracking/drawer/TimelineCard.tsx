import { History } from "lucide-react";

import { ShippingHistory } from "@/src/types/ShippingHistory";

import TimelineItem from "./TimelineItem";

interface TimelineCardProps {
  history: ShippingHistory[];
  loading: boolean;
}

export default function TimelineCard({
  history,
  loading,
}: TimelineCardProps) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8 min-h-[520px]">
      <div className="mb-5 flex items-center gap-3">
        <History
          size={18}
          className="text-blue-600"
        />

        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
          Historique
        </h3>
      </div>

      {loading ? (
        <div className="flex min-h-[180px] items-center justify-center text-sm text-gray-500">
          Chargement...
        </div>
      ) : history.length === 0 ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
          Aucun historique disponible.
        </div>
      ) : (
        <div className="space-y-1">
          {history.map((item, index) => (
            <TimelineItem
              key={item.id}
              item={item}
              isLast={index === history.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}