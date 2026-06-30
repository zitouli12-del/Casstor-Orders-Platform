import { supabase } from "@/src/lib/supabase";
import { getCurrentStore } from "@/src/lib/getCurrentStore";
import { createDeliveryNote } from "./ozon/createDeliveryNote";
import { addParcelsToDeliveryNote } from "./ozon/addParcelsToDeliveryNote";

export async function createBonLivraisonWorkflow(
  selectedIds: number[],
  provider: string
) {
  console.log("STEP 1 - Workflow started");
  console.log("SELECTED IDS =", selectedIds);

  const store = await getCurrentStore();

  const { data: parcels, error } = await supabase
    .from("shipping")
    .select(`
      id,
      tracking_number,
      store_id
    `)
    .eq("store_id", store.id)
    .in("id", selectedIds);

  console.log("PARCELS =", parcels);

  if (error) {
    throw error;
  }

  if (!parcels || parcels.length === 0) {
    throw new Error("Aucun colis trouvé");
  }

  const storeId = store.id;

  console.log("STEP 2 - storeId =", storeId);

  const trackingNumbers = parcels.map(
    (parcel) => parcel.tracking_number
  );

  console.log("STEP 3 - Before createDeliveryNote");

  const createResult =
    await createDeliveryNote(storeId);

  console.log(
    "STEP 4 - createDeliveryNote OK",
    createResult
  );

  const blRef = createResult.blRef;

  const providerDeliveryNoteId =
    createResult.providerDeliveryNoteId;

  console.log(
    "STEP 5 - Before addParcelsToDeliveryNote"
  );

  const addResult =
    await addParcelsToDeliveryNote(
      storeId,
      blRef,
      trackingNumbers
    );

  console.log(
    "STEP 6 - addParcelsToDeliveryNote OK"
  );

  console.log(addResult);

  console.log(
    "STEP 7 - Before insert bon_livraisons"
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
      total_colis: trackingNumbers.length,
      store_id: storeId,
    })
    .select()
    .single();

  console.log("STEP 8");
  console.log("BON =", bonLivraison);
  console.log("BL ERROR =", blError);

  if (blError) {
    throw blError;
  }

  console.log(
    "STEP 9 - Before update shipping"
  );

  const { error: shippingError } =
    await supabase
      .from("shipping")
      .update({
        bon_livraison_id:
          bonLivraison.id,
      })
      .eq("store_id", storeId)
      .in("id", selectedIds);

  console.log("STEP 10");
  console.log(
    "SHIPPING ERROR =",
    shippingError
  );

  if (shippingError) {
    throw shippingError;
  }

  console.log("STEP 11 - FINISHED");

  return {
    success: true,
    blRef,
    addResult,
  };
}