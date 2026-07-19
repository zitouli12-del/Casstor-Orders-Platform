export interface ClientChange {
  id: number;
  shipment_id: number;

  old_order_id: number;
  new_order_id: number;

  old_customer_name: string | null;
  old_customer_phone: string | null;
  old_customer_city: string | null;
  old_customer_address: string | null;

  new_customer_name: string | null;
  new_customer_phone: string | null;
  new_customer_city: string | null;
  new_customer_address: string | null;

  created_at: string;
}