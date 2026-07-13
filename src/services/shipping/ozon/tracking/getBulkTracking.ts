import { BulkTrackingRequest } from "./types";

export async function getBulkTracking({
  config,
  trackingNumbers,
}: BulkTrackingRequest) {
  const response = await fetch(
    `https://api.ozonexpress.ma/customers/${config.clientId}/${config.apiKey}/tracking`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "tracking-number": trackingNumbers,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Ozon Tracking API Error (${response.status})`
    );
  }

  const text = await response.text();

  console.log("========== OZON RAW RESPONSE ==========");
  console.log(text);
  console.log("=======================================");

  return text;
}