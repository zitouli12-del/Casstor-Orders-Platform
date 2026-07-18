export interface ProcessExchangeInput {
  originalShipmentId: number;

  receiver: string;

  phone: string;

  city: string;

  address: string;

  product: string;

  color: string | null;

  size: string | null;

  price: number;

  note: string | null;
}