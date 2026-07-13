interface CompareStatusParams {
  currentStatus: string | null;
  newStatus: string | null;
}

export function compareStatus({
  currentStatus,
  newStatus,
}: CompareStatusParams): boolean {
  return (
    (currentStatus ?? "").trim().toLowerCase() !==
    (newStatus ?? "").trim().toLowerCase()
  );
}