import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/src/lib/supabase";

import { Shipment } from "@/src/types/Shipment";
import { ShippingHistory } from "@/src/types/ShippingHistory";

import DrawerHeader from "./drawer/DrawerHeader";
import ShipmentSummary from "./drawer/ShipmentSummary";
import ClientCard from "./drawer/ClientCard";
import OrderCard from "./drawer/OrderCard";
import TimelineCard from "./drawer/TimelineCard";
import ClientNoteCard from "./drawer/ClientNoteCard";

interface TrackingDrawerProps {
  open: boolean;
  shipment: Shipment | null;
  onClose: () => void;
}

export default function TrackingDrawer({
  open,
  shipment,
  onClose,
}: TrackingDrawerProps) {
  const [history, setHistory] = useState<ShippingHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [currentShipment, setCurrentShipment] =
    useState<Shipment | null>(shipment);

  useEffect(() => {
    setCurrentShipment(shipment);
  }, [shipment]);

  useEffect(() => {
    if (!currentShipment) {
      setHistory([]);
      return;
    }

    async function loadHistory() {
      try {
        setLoadingHistory(true);

        const response = await fetch(
          `/api/tracking-history?shippingId=${currentShipment.id}`
        );

        const result = await response.json();

        if (result.success) {
          setHistory(result.history as ShippingHistory[]);
        } else {
          setHistory([]);
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement de l'historique :",
          error
        );
        setHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadHistory();
  }, [currentShipment]);

  async function handleSaveNote(note: string) {
    if (!currentShipment) return;

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("shipping")
      .update({
        client_note: note,
        client_note_updated_at: now,
      })
      .eq("id", currentShipment.id);

    if (error) {
      toast.error("Erreur lors de l'enregistrement.");
      return;
    }

    setCurrentShipment({
      ...currentShipment,
      client_note: note,
      client_note_updated_at: now,
    });

    toast.success("Note enregistrée.");
  }

  if (!open || !currentShipment) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      />

      {/* Drawer */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
        <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl">
          <DrawerHeader
            shipment={currentShipment}
            onClose={onClose}
          />

          <div className="flex-1 overflow-y-auto px-8 py-7">
            <div className="space-y-7">
              <ShipmentSummary shipment={currentShipment} />

              <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
                <ClientCard shipment={currentShipment} />

                <OrderCard shipment={currentShipment} />
              </div>

              {/* Historique + Note */}
              <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
                <TimelineCard
                  history={history}
                  loading={loadingHistory}
                />

                <ClientNoteCard
                  shipment={currentShipment}
                  onSave={handleSaveNote}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}