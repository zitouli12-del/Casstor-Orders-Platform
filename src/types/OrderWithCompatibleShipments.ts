import { Order } from "./Order";
import { Shipment } from "./Shipment";

export interface OrderWithCompatibleShipments
  extends Order {
  compatibleShipments: Shipment[];
}