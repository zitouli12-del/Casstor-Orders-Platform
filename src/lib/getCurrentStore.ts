import { getServerSupabase } from "./server";

export async function getCurrentStore() {
  const supabase =
    await getServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "Utilisateur non connecté"
    );
  }

  const { data: store, error } =
    await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", user.id)
      .single();

  if (error || !store) {
    throw new Error(
      "Store introuvable"
    );
  }

  return store;
}