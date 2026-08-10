export function getShippingSituationLabel(
  situation: string | null
): string {
  if (!situation) return "—";

  const labels: Record<string, string> = {
    NOT_PAID: "Non payé",
    PAID: "Payé",
    INVOICED: "Facturé",
  };

  return labels[situation] ?? situation;
}