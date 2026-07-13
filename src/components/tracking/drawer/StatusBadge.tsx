import { getShippingStatus } from "@/src/utils/shippingStatus";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const badge = getShippingStatus(status);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badge.badge}`}
    >
      {badge.label}
    </span>
  );
}