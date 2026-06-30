import { History, Calendar, Clock, Wallet } from "lucide-react";

interface HistoriqueDashboardCardsProps {
  totalOrders: number;
  totalToday: number;
  totalYesterday: number;
  totalThisMonth: number;
  totalRevenue: number;
}

export default function HistoriqueDashboardCards({
  totalOrders,
  totalToday,
  totalYesterday,
  totalThisMonth,
  totalRevenue,
}: HistoriqueDashboardCardsProps) {
  const cards = [
    {
      id: "total",
      label: "Total Commandes",
      value: totalOrders,
      icon: History,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      id: "today",
      label: "Aujourd'hui",
      value: totalToday,
      icon: Calendar,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      id: "yesterday",
      label: "Hier",
      value: totalYesterday,
      icon: Clock,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200",
    },
    {
      id: "month",
      label: "Ce Mois",
      value: totalThisMonth,
      icon: Calendar,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200",
    },
    {
      id: "revenue",
      label: "CA Total",
      value: `${totalRevenue} DH`,
      icon: Wallet,
      iconBg: "bg-yellow-50",
      iconColor: "text-yellow-600",
      borderColor: "border-yellow-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`rounded-2xl border ${card.borderColor} bg-white shadow-sm p-5 ${
            card.id === "revenue" ? "col-span-2 md:col-span-1 lg:col-span-1" : ""
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`h-11 w-11 rounded-xl ${card.iconBg} flex items-center justify-center ${card.iconColor} shrink-0`}
            >
              <card.icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.label}
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1 truncate">
                {card.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}