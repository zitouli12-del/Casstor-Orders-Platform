export type ColorLanguage = "fr" | "ar";

interface ColorDefinition {
  key: string;
  fr: string;
  ar: string;
  aliases: string[];
}

const COLOR_DEFINITIONS: ColorDefinition[] = [
  // =====================================================
  // BLEU
  // =====================================================
  {
    key: "blue",
    fr: "Bleu",
    ar: "أزرق",
    aliases: [
      "bleu",
      "blue",
      "ازرق",
      "أزرق",
    ],
  },

  // =====================================================
  // BLEU PÉTROLE
  // =====================================================
  {
    key: "blue_petrol",
    fr: "Bleu Pétrole",
    ar: "أزرق بترولي",
    aliases: [
      "bleu petrole",
      "bleu pétrole",
      "bleupetrole",
      "bleupétrole",
      "petrole",
      "pétrole",
      "blue petrol",
      "petrol blue",

      "ازرق بترولي",
      "أزرق بترولي",
    ],
  },

  // =====================================================
  // BLEU ROI
  // =====================================================
  {
    key: "royal_blue",
    fr: "Bleu Roi",
    ar: "أزرق ملكي",
    aliases: [
      "bleu roi",
      "bleuroi",
      "royal blue",
      "blue royal",

      "ازرق ملكي",
      "أزرق ملكي",
    ],
  },

  // =====================================================
  // BLEU MARINE
  // =====================================================
  {
    key: "navy",
    fr: "Bleu Marine",
    ar: "بلومارين",
    aliases: [
      "bleu marine",
      "bleumarine",
      "blue marine",
      "marine",
      "navy",
      "navy blue",

      "بلومارين",
      "بلو مارين",
      "كحلي",

      "ازرق داكن",
      "أزرق داكن",
    ],
  },

  // =====================================================
  // ROUGE
  // =====================================================
  {
    key: "red",
    fr: "Rouge",
    ar: "أحمر",
    aliases: [
      "rouge",
      "red",

      "احمر",
      "أحمر",
    ],
  },

  // =====================================================
  // VERT
  // =====================================================
  {
    key: "green",
    fr: "Vert",
    ar: "أخضر",
    aliases: [
      "vert",
      "green",

      "اخضر",
      "أخضر",
    ],
  },

  // =====================================================
  // VERT OLIVE
  // =====================================================
  {
    key: "olive_green",
    fr: "Vert Olive",
    ar: "أخضر زيتي",
    aliases: [
      "vert olive",
      "vertolive",
      "olive",
      "olive green",
      "green olive",

      "اخضر زيتي",
      "أخضر زيتي",
      "زيتي",
    ],
  },

  // =====================================================
  // NOIR
  // =====================================================
  {
    key: "black",
    fr: "Noir",
    ar: "أسود",
    aliases: [
      "noir",
      "black",

      "اسود",
      "أسود",
    ],
  },

  // =====================================================
  // BLANC
  // =====================================================
  {
    key: "white",
    fr: "Blanc",
    ar: "أبيض",
    aliases: [
      "blanc",
      "white",

      "ابيض",
      "أبيض",
    ],
  },
];

// =====================================================
// NORMALIZE RAW TEXT
// =====================================================

function normalizeRawColor(value: string): string {
  return value
    .trim()
    .toLowerCase()

    // French / Latin accents
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

    // Arabic diacritics
    .replace(/[\u064B-\u065F\u0670]/g, "")

    // Arabic Alef normalization
    .replace(/[أإآ]/g, "ا")

    // Separators
    .replace(/[_-]+/g, " ")

    // Multiple spaces
    .replace(/\s+/g, " ")

    .trim();
}

// =====================================================
// BUILD ALIAS MAP
// =====================================================

const COLOR_ALIAS_MAP = new Map<string, string>();

for (const definition of COLOR_DEFINITIONS) {
  COLOR_ALIAS_MAP.set(
    normalizeRawColor(definition.key),
    definition.key
  );

  COLOR_ALIAS_MAP.set(
    normalizeRawColor(definition.fr),
    definition.key
  );

  COLOR_ALIAS_MAP.set(
    normalizeRawColor(definition.ar),
    definition.key
  );

  for (const alias of definition.aliases) {
    COLOR_ALIAS_MAP.set(
      normalizeRawColor(alias),
      definition.key
    );
  }
}

// =====================================================
// NORMALIZE COLOR
// =====================================================

/**
 * Returns the stable internal color key.
 *
 * Examples:
 *
 * Bleu       -> blue
 * BLUE       -> blue
 * أزرق       -> blue
 *
 * Bleu Roi   -> royal_blue
 * أزرق ملكي  -> royal_blue
 *
 * Unknown values return null.
 */
export function normalizeColor(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  const normalized = normalizeRawColor(value);

  if (!normalized) {
    return null;
  }

  return COLOR_ALIAS_MAP.get(normalized) ?? null;
}

// =====================================================
// GET DISPLAY LABEL
// =====================================================

export function getColorLabel(
  colorKey: string | null | undefined,
  language: ColorLanguage = "fr"
): string | null {
  if (!colorKey) {
    return null;
  }

  const normalizedKey =
    normalizeColor(colorKey);

  if (!normalizedKey) {
    return null;
  }

  const definition =
    COLOR_DEFINITIONS.find(
      (item) =>
        item.key === normalizedKey
    );

  if (!definition) {
    return null;
  }

  return definition[language];
}

// =====================================================
// COMPARE COLORS
// =====================================================

/**
 * Examples:
 *
 * Bleu + أزرق               -> true
 * Bleu Roi + أزرق ملكي      -> true
 * Vert Olive + زيتي         -> true
 * Bleu + Rouge              -> false
 *
 * Unknown colors never match automatically.
 */
export function colorsMatch(
  first: string | null | undefined,
  second: string | null | undefined
): boolean {
  const firstKey =
    normalizeColor(first);

  const secondKey =
    normalizeColor(second);

  if (!firstKey || !secondKey) {
    return false;
  }

  return firstKey === secondKey;
}

// =====================================================
// DISPLAY VALUE
// =====================================================

/**
 * Converts known colors to the requested language.
 *
 * Unknown values are preserved exactly as received.
 */
export function getColorDisplayValue(
  originalValue: string | null | undefined,
  language: ColorLanguage = "fr"
): string {
  if (!originalValue) {
    return "";
  }

  const key =
    normalizeColor(originalValue);

  if (!key) {
    return originalValue;
  }

  return (
    getColorLabel(key, language) ??
    originalValue
  );
}

export { COLOR_DEFINITIONS };