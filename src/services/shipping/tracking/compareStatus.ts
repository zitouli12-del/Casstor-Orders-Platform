interface CompareStatusParams {
  currentStatus: string | null;
  newStatus: string | null;

  currentSituation: string | null;
  newSituation: string | null;

  currentNote: string | null;
  newNote: string | null;
}

function normalizeValue(value: string | null): string {
  return (value ?? "")
    .trim()
    .toLowerCase();
}

export function compareStatus({
  currentStatus,
  newStatus,
  currentSituation,
  newSituation,
  currentNote,
  newNote,
}: CompareStatusParams): boolean {
  const statusChanged =
    normalizeValue(currentStatus) !==
    normalizeValue(newStatus);

  const situationChanged =
    normalizeValue(currentSituation) !==
    normalizeValue(newSituation);

  const noteChanged =
    normalizeValue(currentNote) !==
    normalizeValue(newNote);

  return (
    statusChanged ||
    situationChanged ||
    noteChanged
  );
}