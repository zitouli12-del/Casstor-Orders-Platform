import {
  Package,
  Truck,
  PhoneOff,
  RotateCcw,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";

import StatCard from "@/src/components/shared/stats/StatCard";

interface TrackingStatsProps {
  stats: {
    total: number;
    preparing: number;
    inDelivery: number;
    noAnswer: number;
    postponed: number;
    returned: number;
    delivered: number;
  };
}

export default function TrackingStats({
  stats,
}: TrackingStatsProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        title="Total Expéditions"
        value={stats.total}
        description="Toutes les expéditions"
        icon={Package}
        color="blue"
      />

      <StatCard
        title="En Distribution"
        value={stats.preparing + stats.inDelivery}
        description="Chez le transporteur"
        icon={Truck}
        color="orange"
      />

      <StatCard
        title="Sans Réponse"
        value={stats.noAnswer}
        description="Clients à relancer"
        icon={PhoneOff}
        color="amber"
      />

      <StatCard
        title="Reportées"
        value={stats.postponed}
        description="Livraison reportée"
        icon={CalendarClock}
        color="slate"
      />

      <StatCard
        title="Retours"
        value={stats.returned}
        description="Colis retournés"
        icon={RotateCcw}
        color="red"
      />

      <StatCard
        title="Livrées"
        value={stats.delivered}
        description="Colis livrés"
        icon={CheckCircle2}
        color="green"
      />
    </div>
  );
}