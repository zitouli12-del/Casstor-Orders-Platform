export interface Shipment {
  id: number;

  provider: string;

  tracking_number: string | null;

  shipping_status: string;

  shipping_situation: string | null;

  shipping_note: string | null;

  client_note: string | null;

  client_note_updated_at: string | null;

  created_at: string;

  updated_at: string;

  bon_livraisons: {
    id: number;
    delivery_note_ref: string | null;
  } | null;

  orders: {
    id: number;

    created_at: string;

    product: string;

    name: string | null;

    phone: string | null;

    city: string | null;

    address: string | null;

    color: string | null;

    size: string | null;

    price: number | null;

    source: string | null;

    notes: string | null;
  } | null;
}