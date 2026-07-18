import { ShippingHistory } from "@/src/types/ShippingHistory";

import StatusBadge from "./StatusBadge";
import StatusIcon from "./StatusIcon";

interface TimelineItemProps {
  item: ShippingHistory;
  isLast: boolean;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TimelineItem({
  item,
  isLast,
}: TimelineItemProps) {
  return (
    <div className="flex gap-4">
      {/* Timeline */}
      <div className="flex w-9 flex-col items-center">
        <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-200 bg-white">
          <StatusIcon status={item.new_status} />
        </div>

        {!isLast && (
          <div className="mt-1 w-px flex-1 bg-gray-200" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <StatusBadge status={item.new_status} />

        <h4 className="mt-2 text-sm font-semibold text-gray-900">
          {item.situation || item.new_status}
        </h4>

        {item.note && (
          <p className="mt-1 text-xs leading-5 text-gray-500">
            {item.note}
          </p>
        )}

        <p className="mt-2 text-xs text-gray-400">
          {formatDate(item.status_date)}
        </p>
      </div>
    </div>
  );
}