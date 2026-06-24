import { supabase } from "@/src/lib/supabase";

export interface OzonConfig {
  clientId: string;
  apiKey: string;
}

export async function getOzonConfig(): Promise<OzonConfig> {
  const { data, error } = await supabase
    .from("shipping_providers")
    .select("*")
    .eq("provider_code", "ozon")
    .single();

  if (error || !data) {
    throw new Error("Configuration Ozon introuvable");
  }

  if (!data.client_id || !data.api_key) {
    throw new Error("Client ID ou API Key Ozon manquant");
  }

  return {
    clientId: data.client_id,
    apiKey: data.api_key,
  };
}