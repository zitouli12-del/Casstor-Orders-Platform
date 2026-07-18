export type ShipmentType =
  | "standard"
  | "exchange";

export interface ShippingParcelInput {
  orderId: number;

  storeId: number;

  shipmentType: ShipmentType;

  parentShipmentId: number | null;

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