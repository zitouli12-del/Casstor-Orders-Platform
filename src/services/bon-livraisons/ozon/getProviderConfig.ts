import { supabase } from "@/src/lib/supabase";

export interface OzonConfig {
  clientId: string;
  apiKey: string;
}

export async function getOzonConfig(
  storeId: number
): Promise<OzonConfig> {

  const { data, error } = await supabase
    .from("shipping_providers")
    .select("*")
    .eq("provider_code", "ozon")
    .eq("store_id", storeId);

  console.log("STORE ID =", storeId);
  console.log("SUPABASE ERROR =", error);
  console.log("SUPABASE DATA =", data);

  if (error || !data || data.length === 0) {
    throw new Error(
      `Configuration Ozon introuvable pour le store ${storeId}`
    );
  }

  const provider = data[0];

  if (!provider.client_id || !provider.api_key) {
    throw new Error(
      "Client ID ou API Key Ozon manquant"
    );
  }

  return {
    clientId: provider.client_id,
    apiKey: provider.api_key,
  };
}