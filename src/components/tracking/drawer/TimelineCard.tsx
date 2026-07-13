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
    <div className="rounded-3xl border border-gray-200 bg-white p-8">
      <div className="mb-8">
        <h3 className="text-lg font-semibold uppercase text-gray-700">
          Historique
        </h3>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">
          Chargement...
        </div>
      ) : history.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">
          Aucun historique disponible.
        </div>
      ) : (
        <div className="space-y-2">
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