import { supabase } from "@/src/lib/supabase";
import { normalizePhone } from "@/src/utils/normalizePhone";

export interface BlacklistEntry {
  id: number;
  store_id: number;
  phone: string;
  normalized_phone: string;
  client_name: string | null;
  reason: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function getBlacklistEntryByPhone(
  phone: string | null | undefined
): Promise<BlacklistEntry | null> {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    return null;
  }

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
    .eq("normalized_phone", normalizedPhone)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}