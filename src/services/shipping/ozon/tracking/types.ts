import type { ProviderConfig } from "@/src/types/tracking/Tracking";

export interface BulkTrackingRequest {
  config: ProviderConfig;
  trackingNumbers: string[];
}