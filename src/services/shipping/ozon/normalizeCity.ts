export function normalizeCity(city: string): string {
  if (!city) return "";

  return city
    // حذف الفراغات الزائدة
    .trim()

    // تحويل للحروف الصغيرة
    .toLowerCase()

    // إزالة Accents الفرنسية
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

    // توحيد العربية
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")

    // حذف "ال" من بداية المدينة
    .replace(/^ال/, "")

    // حذف الفراغات المكررة
    .replace(/\s+/g, " ");
}