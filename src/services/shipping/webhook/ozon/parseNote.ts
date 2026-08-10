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

  // 2. نحيدو HTML ديال Ozon
  const plainText = note
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  console.log("========== PARSE NOTE ==========");
  console.log("RAW NOTE:", note);
  console.log("PLAIN TEXT:", plainText);

  // 3. نقلبو على Livreur
  const livreurMatch = plainText.match(
    /Livreur\s*:\s*(.*)/i
  );

  if (livreurMatch) {
    const afterLivreur = livreurMatch[1].trim();

    console.log("AFTER LIVREUR:", afterLivreur);

    // 4. نقلبو على رقم الهاتف مباشرة
    // ما يهمناش واش مكتوب Téléphone / Telephone / أي label آخر
    const phoneMatch = afterLivreur.match(
      /(?:\+212\s*)?0?\d(?:[\s().-]*\d){8,}/
    );

    console.log("PHONE MATCH:", phoneMatch);

    if (phoneMatch) {
      const courierPhone = phoneMatch[0].trim();

      // 5. الاسم هو كلشي اللي قبل رقم الهاتف
      // ونحيدو آخر label بحال Téléphone: / Telephone: / T�l�phone:
      const courierName = afterLivreur
        .slice(0, phoneMatch.index)
        .replace(/\s+\S+\s*:\s*$/i, "")
        .trim();

      console.log("COURIER NAME:", courierName);
      console.log("COURIER PHONE:", courierPhone);

      if (courierName && courierPhone) {
        console.log("========== COURIER FOUND ==========");

        return {
          courierName,
          courierPhone,
          note: null,
          type: "courier",
        };
      }
    }
  }

  // 6. Note عادية
  console.log("========== NORMAL NOTE ==========");

  return {
    courierName: null,
    courierPhone: null,
    note,
    type: "note",
  };
}