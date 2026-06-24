export interface BonLivraison {
  id: number;

  provider: string;

  delivery_note_ref: string | null;

  provider_delivery_note_id: number | null;

  status: "draft" | "validated" | "printed";

  total_colis: number;

  created_at: string;
  updated_at: string;
}