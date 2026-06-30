import { getOzonConfig } from "./getProviderConfig";

export async function addParcelsToDeliveryNote(
  storeId: number,
  blRef: string,
  trackingNumbers: string[]
) {
  const config = await getOzonConfig(storeId);

  const url =
    `https://api.ozonexpress.ma/customers/${config.clientId}/${config.apiKey}/add-parcel-to-delivery-note`;

  const formData = new FormData();

  formData.append("Ref", blRef);

  trackingNumbers.forEach(
    (trackingNumber, index) => {
      formData.append(
        `Codes[${index}]`,
        trackingNumber
      );
    }
  );

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const responseText =
    await response.text();

  // TODO: Create Ozon Add Parcels Response Type
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
      "Erreur ajout colis au BL"
    );
  }

  return data;
}