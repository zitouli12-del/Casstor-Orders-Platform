import { getOzonConfig } from "../../bon-livraisons/ozon/getProviderConfig";
import { OzonParcelPayload } from "@/src/types/ozon/OzonParcel";

export async function sendParcel(
  payload: OzonParcelPayload,
  storeId: number
) {
  const config = await getOzonConfig(storeId);

  const url = `https://api.ozonexpress.ma/customers/${config.clientId}/${config.apiKey}/add-parcel`;

  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  console.log("OZON PAYLOAD =", payload);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const responseText = await response.text();

  let data: Record<string, unknown>;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Réponse Ozon invalide: ${responseText}`
    );
  }

  if (!response.ok) {
    throw new Error(
      (data?.message as string) ||
      (data?.error as string) ||
      "Erreur lors de la création du colis"
    );
  }

  console.log("OZON RESPONSE =", responseText);

  // TODO: Create Ozon API response type
  const addParcel = data?.["ADD-PARCEL"] as Record<string, any>;
  const newParcel = addParcel?.["NEW-PARCEL"] as Record<string, any>;
  const trackingNumber = newParcel?.["TRACKING-NUMBER"];

  if (!trackingNumber) {
    throw new Error(
      `Ozon n'a pas retourné de numéro de suivi: ${responseText}`
    );
  }

  return {
    ...data,
    trackingNumber,
  };
}