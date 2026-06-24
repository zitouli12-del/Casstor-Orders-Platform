export interface Shipping {
  id: number;

  order_id: number;

  provider: string;

  tracking_number: string | null;

  shipping_status: string;

  bon_livraison_id: number | null;

  created_at: string;
  updated_at: string;
}