import { normalizePhone } from "@/src/utils/normalizePhone";

import { BlacklistEntry } from "./getBlacklistEntryByPhone";

export function findBlacklistEntryByPhone(
  phone: string | null | undefined,
  blacklist: BlacklistEntry[]
): BlacklistEntry | null {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    return null;
  }

  return (
    blacklist.find(
      (entry) =>
        entry.normalized_phone === normalizedPhone
    ) ?? null
  );
}