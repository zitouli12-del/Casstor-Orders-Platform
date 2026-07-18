import { supabase } from "@/src/lib/supabase";
import { normalizePhone } from "@/src/utils/normalizePhone";

interface AddClientToBlacklistParams {
  phone: string;
  clientName?: string | null;
  reason: string;
  notes?: string | null;
}

export async function addClientToBlacklist({
  phone,
  clientName,
  reason,
  notes,
}: AddClientToBlacklistParams) {
  const normalizedPhone = normalizePhone(phone);
  const cleanReason = reason.trim();
  const cleanNotes = notes?.trim() || null;
  const cleanClientName = clientName?.trim() || null;

  if (!normalizedPhone) {
    throw new Error("Numéro de téléphone invalide.");
  }

  if (!cleanReason) {
    throw new Error(
      "La raison de l'ajout à la blacklist est obligatoire."
    );
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
    .insert({
      store_id: store.id,
      phone,
      normalized_phone: normalizedPhone,
      client_name: cleanClientName,
      reason: cleanReason,
      notes: cleanNotes,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "Ce client existe déjà dans votre blacklist."
      );
    }

    throw error;
  }

  return data;
}