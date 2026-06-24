import { supabase } from "@/src/lib/supabase";
import { normalizeCity } from "./normalizeCity";

export async function resolveCity(
  city: string
): Promise<number> {

  const normalizedInput =
    normalizeCity(city);

  const { data, error } = await supabase
    .from("ozon_cities")
    .select(
      "city_name, ozon_city_id"
    );

  if (error) {
    throw new Error(
      "Impossible de charger les villes Ozon"
    );
  }

  const matchedCity = data?.find(
    (c) =>
      normalizeCity(
        c.city_name
      ) === normalizedInput
  );

  if (!matchedCity) {
    throw new Error(
      `Ville introuvable: ${city}`
    );
  }

  return matchedCity.ozon_city_id;
}