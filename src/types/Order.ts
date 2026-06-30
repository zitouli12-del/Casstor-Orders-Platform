export interface Order {
  id: number;

  store_id: number;

  created_at: string;
  updated_at: string | null;

  product: string;

  name: string | null;
  phone: string | null;
  city: string |null;
  address: string | null;

  color: string | null;
  size: string | null;

  price: number | null;

  status: string;

  source: string | null;
  notes: string | null;

  livreur_comment: string | null;
}