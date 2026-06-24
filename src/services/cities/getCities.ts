import { supabase } from "@/src/lib/supabase";

export async function getCities() {
  const { data, error } = await supabase
    .from("ozon_cities")
    .select("city_name")
    .order("city_name");

  if (error) {
    throw new Error(
      "Impossible de charger les villes"
    );
  }

  return data;
}