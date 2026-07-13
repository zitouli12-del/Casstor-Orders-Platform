import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

export interface ActiveStore {
  id: number;
}

export async function getActiveStores(): Promise<ActiveStore[]> {
  const { data, error } = await supabaseAdmin
    .from("stores")
    .select("id")
    .eq("is_active", true);

  if (error) {
    throw new Error(
      `Failed to load stores: ${error.message}`
    );
  }

  return data ?? [];
}