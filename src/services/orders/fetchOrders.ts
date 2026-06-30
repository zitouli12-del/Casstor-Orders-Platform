import { supabase } from "@/src/lib/supabase";

async function getCurrentStoreId() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("No user found:", userError);
    return null;
  }

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (storeError || !store) {
    console.error("No store found for user:", storeError);
    return null;
  }

  return store.id;
}

export async function fetchOrders() {
  const storeId = await getCurrentStoreId();

  if (!storeId) {
    return [];
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}