export interface Parcel {
  id: number;

  tracking_number: string;

  orders: {
    name: string;
    city: string;
    price: number;
  } | null;
}