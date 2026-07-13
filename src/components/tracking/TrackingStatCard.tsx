import { LucideIcon } from "lucide-react";

interface TrackingStatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
}

export default function TrackingStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor,
  iconColor,
}: TrackingStatCardProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs text-slate-500">
          {title}
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          {value}
        </h2>

        {subtitle && (
          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBgColor}`}
      >
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
    </div>
  );
}