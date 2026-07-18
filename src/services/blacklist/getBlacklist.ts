import { supabase } from "@/src/lib/supabase";

import { BlacklistEntry } from "./getBlacklistEntryByPhone";

export async function getBlacklist(): Promise<
  BlacklistEntry[]
> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Utilisateur non authentifié.");
  }

  const { data: store, error: storeError } =
    await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

  if (storeError) {
    throw storeError;
  }

  if (!store) {
    throw new Error("Boutique introuvable.");
  }

  const { data, error } = await supabase
    .from("blacklist")
    .select(`
      id,
      store_id,
      phone,
      normalized_phone,
      client_name,
      reason,
      notes,
      created_at,
      updated_at
    `)
    .eq("store_id", store.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as BlacklistEntry[];
}