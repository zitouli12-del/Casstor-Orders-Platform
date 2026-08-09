export interface ParsedOzonNote {
  courierName: string | null;
  courierPhone: string | null;
  note: string | null;
  type: "courier" | "note" | "empty";
}

export function parseOzonNote(
  rawNote: string | null | undefined
): ParsedOzonNote {
  // 1. Note خاوية
  if (!rawNote || !rawNote.trim()) {
    return {
      courierName: null,
      courierPhone: null,
      note: null,
      type: "empty",
    };
  }

  const note = rawNote.trim();

  // 2. البحث على صيغة Ozon ديال livreur
  const courierMatch = note.match(
    /<b>\s*Livreur:\s*<\/b>\s*([\s\S]*?)\s*<br\s*\/?>\s*<b>\s*T[ée]l[ée]phone:\s*<\/b>\s*([0-9+\s()-]+)\s*/i
  );

  if (courierMatch) {
    const courierName = courierMatch[1].trim();
    const courierPhone = courierMatch[2].trim();

    return {
      courierName,
      courierPhone,
      note: null,
      type: "courier",
    };
  }

  // 3. Note عادية
  return {
    courierName: null,
    courierPhone: null,
    note: note,
    type: "note",
  };
}