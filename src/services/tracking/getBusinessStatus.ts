import { STATUS_GROUPS } from "./statusGroups";

export type BusinessStatus =
  | "preparing"
  | "inDelivery"
  | "noAnswer"
  | "postponed"
  | "returned"
  | "delivered"
  | "unknown";

export function getBusinessStatus(
  shippingStatus: string | null | undefined
): BusinessStatus {
  if (!shippingStatus) {
    return "unknown";
  }

  for (const [group, statuses] of Object.entries(STATUS_GROUPS)) {
    if (statuses.includes(shippingStatus as never)) {
      return group as BusinessStatus;
    }
  }

  return "unknown";
}