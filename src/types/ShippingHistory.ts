export interface ShippingHistory {
  id: number;

  shipping_id: number;

  old_status: string | null;

  new_status: string;

  situation: string | null;

  note: string | null;

  status_date: string;

  created_at: string;
}