import {
  Package,
  Truck,
  Send,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Ban,
  Circle,
} from "lucide-react";

interface StatusIconProps {
  status: string;
}

export default function StatusIcon({
  status,
}: StatusIconProps) {
  switch (status?.toLowerCase()) {
    case "nouveau colis":
      return (
        <Package className="h-4 w-4 text-slate-500" />
      );

    case "expédié":
      return (
        <Send className="h-4 w-4 text-orange-500" />
      );

    case "mise en distribution":
      return (
        <Truck className="h-4 w-4 text-blue-500" />
      );

    case "livré":
      return (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      );

    case "retour":
      return (
        <RotateCcw className="h-4 w-4 text-red-500" />
      );

    case "refusé":
      return (
        <XCircle className="h-4 w-4 text-red-500" />
      );

    case "annulé":
      return (
        <Ban className="h-4 w-4 text-gray-500" />
      );

    default:
      return (
        <Circle className="h-4 w-4 text-gray-400" />
      );
  }
}