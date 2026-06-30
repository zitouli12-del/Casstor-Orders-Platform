import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export default function StatCard({
  title,
  value,
  subtitle = "Aujourd'hui",
  icon: Icon,
  iconBg,
  iconColor,
}: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className="mt-2 text-4xl font-bold text-slate-900">
            {value}
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg}`}
        >
          <Icon
            className={`h-7 w-7 ${iconColor}`}
          />
        </div>

      </div>
    </div>
  );
}