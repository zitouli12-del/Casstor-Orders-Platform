export interface Shipment {
  id: number;

  order_id: number;

  provider: string;

  tracking_number: string | null;

  shipping_status: string;

  shipping_situation: string | null;

  shipping_note: string | null;

  client_note: string | null;

  client_note_updated_at: string | null;

  shipment_type: "standard" | "exchange";

  parent_shipment_id: number | null;

  customer_name: string | null;

  customer_phone: string | null;

  customer_city: string | null;

  customer_address: string | null;

  courier_name: string | null;

  courier_phone: string | null;

  parcel_product: string | null;

  parcel_color: string | null;

  parcel_size: string | null;

  parcel_price: number | null;

  bon_livraison_id: number | null;

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