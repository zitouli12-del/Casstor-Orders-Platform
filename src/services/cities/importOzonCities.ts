import { supabase } from "@/src/lib/supabase";

export async function importOzonCities() {
  const response = await fetch(
    "https://api.ozonexpress.ma/cities"
  );

  const data = await response.json();

  const cities = Object.values(
    data.CITIES
  ).map((city: any) => ({
    city_name: city.NAME,
    ozon_city_id: city.ID,
    tariff: city["DELIVERED-PRICE"],
  }));

  const { error: deleteError } =
    await supabase
      .from("ozon_cities")
      .delete()
      .neq("id", 0);

  if (deleteError) {
    throw deleteError;
  }

  const { error: insertError } =
    await supabase
      .from("ozon_cities")
      .insert(cities);

  if (insertError) {
    throw insertError;
  }

  return {
    total: cities.length,
  };
}