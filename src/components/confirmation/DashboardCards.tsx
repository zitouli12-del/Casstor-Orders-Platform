import { Package, CheckCircle2, PhoneOff } from "lucide-react";
import StatCard from "@/src/components/ui/stat-card";

interface DashboardCardsProps {
  totalNouvelle: number;
  totalConfirme: number;
  totalPsReponse: number;
}

export default function DashboardCards({
  totalNouvelle,
  totalConfirme,
  totalPsReponse,
}: DashboardCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <StatCard
        title="Nouvelles"
        value={totalNouvelle}
        icon={Package}
        iconBg="bg-orange-100"
        iconColor="text-orange-600"
      />

      <StatCard
        title="Confirmées"
        value={totalConfirme}
        icon={CheckCircle2}
        iconBg="bg-emerald-100"
        iconColor="text-emerald-600"
      />

      <StatCard
        title="Ps-réponse"
        value={totalPsReponse}
        icon={PhoneOff}
        iconBg="bg-amber-100"
        iconColor="text-amber-600"
      />
    </div>
  );
}