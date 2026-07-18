import { ExchangeFormData } from "@/src/types/ExchangeForm";

export async function createExchange(
  originalShipmentId: number,
  form: ExchangeFormData
) {
  const response = await fetch(
    "/api/shipping/exchange",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        originalShipmentId,
        ...form,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error ??
        "Création impossible."
    );
  }

  return result;
}