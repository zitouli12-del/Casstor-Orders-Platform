import { TrackingResponse } from "@/src/types/tracking/Tracking";

export function parseTrackingResponse(
  rawResponse: string
): TrackingResponse[] {
  const data = JSON.parse(rawResponse);

  const trackingList =
    data["TRACKING-LIST"] ?? {};

  return Object.entries(trackingList).map(
    (
      [trackingNumber, value]: [string, any]
    ): TrackingResponse => ({
      trackingNumber,
      status: value.STATUT ?? "",
      situation: value.SITUATION ?? null,
      note: value.NOTE ?? null,
      date: value.TIME_STR ?? null,
    })
  );
}