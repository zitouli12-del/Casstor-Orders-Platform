import { normalizePhone } from "@/src/utils/normalizePhone";

interface OrderPhoneHistory {
  orderCount: number;
  isPossibleDuplicate: boolean;
}

const DUPLICATE_WINDOW_MINUTES = 15;

export function analyzeOrderPhoneHistory(
  currentOrder: any,
  allOrders: any[]
): OrderPhoneHistory {
  const currentPhone = normalizePhone(
    currentOrder.phone
  );

  if (!currentPhone) {
    return {
      orderCount: 0,
      isPossibleDuplicate: false,
    };
  }

  const ordersWithSamePhone = allOrders.filter(
    (order) =>
      normalizePhone(order.phone) === currentPhone
  );

  const currentCreatedAt = new Date(
    currentOrder.created_at
  ).getTime();

  const duplicateWindowMs =
    DUPLICATE_WINDOW_MINUTES * 60 * 1000;

  const isPossibleDuplicate =
    ordersWithSamePhone.some((order) => {
      if (order.id === currentOrder.id) {
        return false;
      }

      const otherCreatedAt = new Date(
        order.created_at
      ).getTime();

      const timeDifference = Math.abs(
        currentCreatedAt - otherCreatedAt
      );

      return timeDifference <= duplicateWindowMs;
    });

  return {
    orderCount: ordersWithSamePhone.length,
    isPossibleDuplicate,
  };
}