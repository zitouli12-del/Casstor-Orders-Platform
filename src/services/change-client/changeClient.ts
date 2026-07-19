import { supabase } from "@/src/lib/supabase";

interface ChangeClientParams {
  shipmentId: number;
  newOrderId: number;
}

export async function changeClient({
  shipmentId,
  newOrderId,
}: ChangeClientParams) {
  // 1. جلب الشحنة الحالية
  const { data: shipment, error: shipmentError } = await supabase
    .from("shipping")
    .select(`
      id,
      order_id,
      customer_name,
      customer_phone,
      customer_city,
      customer_address
    `)
    .eq("id", shipmentId)
    .single();

  if (shipmentError) {
    throw shipmentError;
  }

  // 2. جلب معلومات العميل الجديد
  const { data: newOrder, error: orderError } = await supabase
    .from("orders")
    .select(`
      id,
      name,
      phone,
      city,
      address
    `)
    .eq("id", newOrderId)
    .single();

  if (orderError) {
    throw orderError;
  }

  // 3. حفظ Snapshot قبل التعديل
  const { error: historyError } = await supabase
    .from("shipment_client_changes")
    .insert({
      shipment_id: shipmentId,

      old_order_id: shipment.order_id,
      new_order_id: newOrderId,

      old_customer_name: shipment.customer_name,
      old_customer_phone: shipment.customer_phone,
      old_customer_city: shipment.customer_city,
      old_customer_address: shipment.customer_address,

      new_customer_name: newOrder.name,
      new_customer_phone: newOrder.phone,
      new_customer_city: newOrder.city,
      new_customer_address: newOrder.address,
    });

  if (historyError) {
    throw historyError;
  }

  // 4. تحديث بيانات الشحنة
  const { error: updateError } = await supabase
    .from("shipping")
    .update({
      order_id: newOrderId,

      customer_name: newOrder.name,
      customer_phone: newOrder.phone,
      customer_city: newOrder.city,
      customer_address: newOrder.address,
    })
    .eq("id", shipmentId);

  if (updateError) {
    throw updateError;
  }

  // 5. Marquer la nouvelle commande comme déjà expédiée
  const { error: updateOrderError } = await supabase
    .from("orders")
    .update({
      shipping_stage: "sent",
    })
    .eq("id", newOrderId);

  if (updateOrderError) {
    throw updateOrderError;
  }
}