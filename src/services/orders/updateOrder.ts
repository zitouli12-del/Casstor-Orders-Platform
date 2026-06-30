import { supabase } from "@/src/lib/supabase";

export async function updateOrder(
  selectedOrder: any,
  editedFields: { [key: string]: any }
) {
  const priceValue = parseInt(editedFields.price, 10);
  
  const updateData = {
    name: editedFields.name,
    phone: editedFields.phone,
    city: editedFields.city,
    address: editedFields.address,
    color: editedFields.color,
    size: editedFields.size,
    price: isNaN(priceValue) ? 0 : priceValue,
    notes: editedFields.notes,
    livreur_comment: editedFields.livreur_comment,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", selectedOrder.id)
    .select();

  console.log("SAVE UPDATE DATA =", data);
  console.log("SAVE UPDATE ERROR =", error);

  if (error) {
    console.error("Update error:", error);
    throw error;
  }

  return data;
}