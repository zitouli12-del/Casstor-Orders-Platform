/**
 * ============================================================
 * Tracking Module Types
 * ============================================================
 */

export interface ProviderConfig {
  providerCode: string;
  providerName: string;
  clientId: string;
  apiKey: string;
}

export interface TrackingResponse {
  trackingNumber: string;
  status: string;
  situation: string | null;
  note: string | null;
  date: string | null;
}