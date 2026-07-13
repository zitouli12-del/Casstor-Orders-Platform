export function normalizePhone(
  phone?: string | null
): string {
  if (!phone) return "";

  let normalized = phone.replace(/\D/g, "");

  if (normalized.startsWith("00212")) {
    normalized = normalized.slice(5);
  } else if (normalized.startsWith("212")) {
    normalized = normalized.slice(3);
  }

  if (normalized.startsWith("0")) {
    normalized = normalized.slice(1);
  }

  return normalized;
}