import { getOzonConfig } from "./getProviderConfig";
import { OzonDeliveryNoteResponse } from "../../../types/ozon/OzonDeliveryNote";

export async function createDeliveryNote(
  storeId: number
): Promise<OzonDeliveryNoteResponse> {

  const config = await getOzonConfig(storeId);

  const url =
    `https://api.ozonexpress.ma/customers/${config.clientId}/${config.apiKey}/add-delivery-note`;

  const response = await fetch(url, {
    method: "POST",
  });

  const responseText = await response.text();

  console.log("RAW RESPONSE =", responseText);

  let data: any;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Réponse Ozon invalide: ${responseText}`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      "Erreur création BL"
    );
  }

  const blRef =
    data?.["ADD-BL"]?.["NEW-BL"]?.["REF"];

  const providerDeliveryNoteId =
    data?.["ADD-BL"]?.["NEW-BL"]?.["ID"];

  if (!blRef || !providerDeliveryNoteId) {
    throw new Error("Réponse Ozon invalide");
  }

  return {
    blRef,
    providerDeliveryNoteId,
  };
}