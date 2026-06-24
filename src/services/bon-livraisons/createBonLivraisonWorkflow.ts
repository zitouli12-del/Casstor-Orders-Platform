import { supabase } from "@/src/lib/supabase";
import { createDeliveryNote } from "./ozon/createDeliveryNote";
import { addParcelsToDeliveryNote } from "./ozon/addParcelsToDeliveryNote";

export async function createBonLivraisonWorkflow(
  selectedIds: number[],
  provider: string
) {
  const { data: parcels, error } = await supabase
    .from("shipping")
    .select(`
      id,
      tracking_number
    `)
    .in("id", selectedIds);

  if (error) {
    throw error;
  }

  const trackingNumbers =
    parcels.map(
      (parcel) => parcel.tracking_number
    );

  const createResult =
    await createDeliveryNote();

  const blRef =
    createResult.blRef;

  const providerDeliveryNoteId =
    createResult.providerDeliveryNoteId;

  const addResult =
    await addParcelsToDeliveryNote(
      blRef,
      trackingNumbers
    );

  const {
    data: bonLivraison,
    error: blError,
  } = await supabase
    .from("bon_livraisons")
    .insert({
      provider,
      delivery_note_ref: blRef,
      provider_delivery_note_id:
        providerDeliveryNoteId,
      status: "validated",
      total_colis:
        trackingNumbers.length,
    })
    .select()
    .single();

  if (blError) {
    throw blError;
  }

  const { error: shippingError } =
    await supabase
      .from("shipping")
      .update({
        bon_livraison_id:
          bonLivraison.id,
      })
      .in("id", selectedIds);

  if (shippingError) {
    throw shippingError;
  }

  return {
    success: true,
    blRef,
    addResult,
  };
}