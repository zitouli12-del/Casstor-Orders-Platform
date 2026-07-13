interface TrackingStatusBadgeProps {
  status: string;
}

function getStatusClasses(status: string) {
  switch (status) {
    case "Nouveau Colis":
      return "bg-blue-100 text-blue-700";

    case "En Distribution":
      return "bg-yellow-100 text-yellow-700";

    case "Livré":
      return "bg-green-100 text-green-700";

    case "Annulé":
      return "bg-red-100 text-red-700";

    case "Refusé":
      return "bg-red-100 text-red-700";

    case "Retour":
      return "bg-orange-100 text-orange-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function TrackingStatusBadge({
  status,
}: TrackingStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
        status
      )}`}
    >
      {status}
    </span>
  );
}