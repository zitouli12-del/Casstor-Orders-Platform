import { supabase } from "@/src/lib/supabase";
import { ProviderConfig } from "@/src/types/tracking/Tracking";

/**
 * Returns the active shipping provider configuration
 * for the given store.
 */
export async function getProviderConfig(
  storeId: number
): Promise<ProviderConfig> {
  const { data, error } = await supabase
    .from("shipping_providers")
    .select(
      `
      provider_code,
      provider_name,
      client_id,
      api_key,
      is_active
      `
    )
    .eq("store_id", storeId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error("No active shipping provider found.");
  }

  if (!data.client_id || !data.api_key) {
    throw new Error("Shipping provider credentials are incomplete.");
  }

  return {
    providerCode: data.provider_code,
    providerName: data.provider_name,
    clientId: data.client_id,
    apiKey: data.api_key,
  };
}