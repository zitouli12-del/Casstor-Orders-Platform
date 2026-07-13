import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  color:
    | "blue"
    | "green"
    | "orange"
    | "red"
    | "amber"
    | "slate";
}

const colorClasses = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-600",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-600",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-600",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  slate: {
    bg: "bg-slate-100",
    text: "text-slate-600",
  },
};

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: StatCardProps) {
  const styles = colorClasses[color];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </h2>

          <p className="mt-1 text-xs text-gray-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${styles.bg}`}
        >
          <Icon className={`h-6 w-6 ${styles.text}`} />
        </div>
      </div>
    </div>
  );
}