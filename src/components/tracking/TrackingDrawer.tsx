import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/src/lib/supabase";

import { Shipment } from "@/src/types/Shipment";
import { ShippingHistory } from "@/src/types/ShippingHistory";
import { addClientToBlacklist } from "@/src/services/blacklist/addClientToBlacklist";
import {
  BlacklistEntry,
  getBlacklistEntryByPhone,
} from "@/src/services/blacklist/getBlacklistEntryByPhone";

import DrawerHeader from "./drawer/DrawerHeader";
import ClientCard from "./drawer/ClientCard";
import OrderCard from "./drawer/OrderCard";
import TimelineCard from "./drawer/TimelineCard";
import ClientNoteCard from "./drawer/ClientNoteCard";
import BlacklistCard from "./drawer/BlacklistCard";
import BlacklistModal from "./drawer/BlacklistModal";

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
  const [currentShipment, setCurrentShipment] = useState<Shipment | null>(shipment);
  const [blacklistModalOpen, setBlacklistModalOpen] = useState(false);
  const [savingBlacklist, setSavingBlacklist] = useState(false);
  const [blacklistEntry, setBlacklistEntry] = useState<BlacklistEntry | null>(null);
  const [checkingBlacklist, setCheckingBlacklist] = useState(false);

  useEffect(() => { setCurrentShipment(shipment); }, [shipment]);
  useEffect(() => {
    if (!open) {
      setBlacklistModalOpen(false);
      setSavingBlacklist(false);
      setBlacklistEntry(null);
      setCheckingBlacklist(false);
    }
  }, [open]);

  useEffect(() => {
    const phone = currentShipment?.orders?.phone;
    if (!phone) { setBlacklistEntry(null); setCheckingBlacklist(false); return; }
    let cancelled = false;
    async function checkBlacklist() {
      try {
        setCheckingBlacklist(true);
        const entry = await getBlacklistEntryByPhone(phone);
        if (cancelled) return;
        setBlacklistEntry(entry);
      } catch (error) {
        console.error("CHECK BLACKLIST FAILED =", error);
        if (cancelled) return;
        setBlacklistEntry(null);
      } finally {
        if (!cancelled) setCheckingBlacklist(false);
      }
    }
    checkBlacklist();
    return () => { cancelled = true; };
  }, [currentShipment?.orders?.phone]);

  useEffect(() => {
    if (!currentShipment) { setHistory([]); return; }
    const shipmentId = currentShipment.id;
    async function loadHistory() {
      try {
        setLoadingHistory(true);
        const response = await fetch(`/api/tracking-history?shippingId=${shipmentId}`);
        const result = await response.json();
        setHistory(result.success ? (result.history as ShippingHistory[]) : []);
      } catch (error) {
        console.error("Erreur lors du chargement de l'historique :", error);
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
    const { error } = await supabase.from("shipping").update({ client_note: note, client_note_updated_at: now }).eq("id", currentShipment.id);
    if (error) { toast.error("Erreur lors de l'enregistrement."); return; }
    setCurrentShipment({ ...currentShipment, client_note: note, client_note_updated_at: now });
    toast.success("Note enregistrée.");
  }

  function handleOpenBlacklistModal() {
    const order = currentShipment?.orders;
    if (!order?.phone) { toast.error("Le numéro de téléphone du client est introuvable."); return; }
    if (blacklistEntry) { toast.info("Ce client est déjà dans votre blacklist."); return; }
    setBlacklistModalOpen(true);
  }

  function handleCloseBlacklistModal() { if (savingBlacklist) return; setBlacklistModalOpen(false); }

  async function handleAddToBlacklist({ reason, notes }: { reason: string; notes: string }) {
    const order = currentShipment?.orders;
    if (!order?.phone) { toast.error("Le numéro de téléphone du client est introuvable."); return; }
    try {
      setSavingBlacklist(true);
      const newBlacklistEntry = await addClientToBlacklist({ phone: order.phone, clientName: order.name, reason, notes });
      setBlacklistEntry(newBlacklistEntry as BlacklistEntry);
      setBlacklistModalOpen(false);
      toast.success("Client ajouté à la blacklist.", { description: "Ce client sera signalé lors de ses prochaines commandes." });
    } catch (error) {
      console.error("ADD CLIENT TO BLACKLIST FAILED =", error);
      toast.error("Impossible d'ajouter le client à la blacklist.", { description: error instanceof Error ? error.message : "Une erreur inconnue est survenue." });
    } finally {
      setSavingBlacklist(false);
    }
  }

  if (!open || !currentShipment) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
        <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl">
          <DrawerHeader shipment={currentShipment} onClose={onClose} />

          <div className="flex-1 overflow-y-auto px-8 py-7">
            <div className="grid grid-cols-2 gap-7 items-start">
              
              {/* Colonne Gauche */}
              <div className="flex flex-col gap-7">
                <ClientCard
                  shipment={currentShipment}
                  blacklistEntry={blacklistEntry}
                  checkingBlacklist={checkingBlacklist}
                  onAddToBlacklist={handleOpenBlacklistModal}
                />
                <OrderCard shipment={currentShipment} />
              </div>

              {/* Colonne Droite */}
              <div className="flex flex-col gap-7">
                <ClientNoteCard shipment={currentShipment} onSave={handleSaveNote} />
                <TimelineCard history={history} loading={loadingHistory} />
                <BlacklistCard
                  blacklistEntry={blacklistEntry}
                  checkingBlacklist={checkingBlacklist}
                  onAddToBlacklist={handleOpenBlacklistModal}
                />
              </div>

            </div>
          </div>
        </div>
      </div>

      <BlacklistModal
        open={blacklistModalOpen}
        clientName={currentShipment.orders?.name}
        phone={currentShipment.orders?.phone}
        saving={savingBlacklist}
        onClose={handleCloseBlacklistModal}
        onConfirm={handleAddToBlacklist}
      />
    </>
  );
}