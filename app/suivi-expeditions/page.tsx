"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import ExchangeDrawer from "@/src/components/exchange/drawer/ExchangeDrawer";
import DeleteShipmentDialog from "@/src/components/tracking/delete/DeleteShipmentDialog";

import TrackingMobileList from "@/src/components/tracking/TrackingMobileList";
import TrackingHeader from "@/src/components/tracking/TrackingHeader";
import TrackingStats from "@/src/components/tracking/TrackingStats";
import TrackingFilters from "@/src/components/tracking/TrackingFilters";
import TrackingTable from "@/src/components/tracking/TrackingTable";
import TrackingDrawer from "@/src/components/tracking/TrackingDrawer";

import { getShipments } from "@/src/services/tracking/getShipments";
import { filterShipments } from "@/src/services/tracking/filterShipments";
import { getTrackingStats } from "@/src/services/tracking/getTrackingStats";

export default function SuiviExpeditionsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [provider, setProvider] = useState("all");
  const [date, setDate] = useState("all");

  const [selectedShipment, setSelectedShipment] =
    useState<any | null>(null);

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [exchangeOpen, setExchangeOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  async function loadShipments() {
    try {
      setLoading(true);

      const data = await getShipments();

      setShipments(data);
    } catch (error) {
      console.error(
        "LOAD SHIPMENTS FAILED =",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShipments();
  }, []);

  function openDrawer(shipment: any) {
    setSelectedShipment(shipment);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedShipment(null);
  }

  function openExchange(shipment: any) {
    setSelectedShipment(shipment);
    setExchangeOpen(true);
  }

  function closeExchange() {
    setExchangeOpen(false);
  }

  function openDelete(shipment: any) {
    setSelectedShipment(shipment);
    setDeleteOpen(true);
  }

  function closeDelete() {
    setDeleteOpen(false);
  }

  async function handleSync() {
    if (syncing) return;

    try {
      setSyncing(true);

      const response = await fetch(
        "/api/test-tracking"
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ??
            "La synchronisation a échoué."
        );
      }

      await loadShipments();

      if (result.failed > 0) {
        const firstError =
          result.errors?.[0];

        toast.warning(
          "Synchronisation terminée avec erreurs",
          {
            description: [
              `${result.processed} expéditions vérifiées`,
              `${result.updated} statuts mis à jour`,
              `${result.skipped} sans changement`,
              `${result.failed} erreur(s)`,
              firstError
                ? `Première erreur: ${firstError.step} — ${firstError.message}`
                : null,
            ]
              .filter(Boolean)
              .join(" • "),
            duration: 10000,
          }
        );

        return;
      }

      if (result.updated > 0) {
        toast.success(
          "Synchronisation terminée",
          {
            description:
              `${result.processed} expéditions vérifiées • ` +
              `${result.updated} statuts mis à jour • ` +
              `${result.skipped} sans changement`,
            duration: 7000,
          }
        );

        return;
      }

      toast.info(
        "Synchronisation terminée",
        {
          description:
            `${result.processed} expéditions vérifiées • Aucun changement détecté`,
          duration: 5000,
        }
      );
    } catch (error) {
      console.error(
        "TRACKING SYNC REQUEST FAILED =",
        error
      );

      toast.error(
        "Échec de la synchronisation",
        {
          description:
            error instanceof Error
              ? error.message
              : "Une erreur inconnue est survenue.",
          duration: 10000,
        }
      );
    } finally {
      setSyncing(false);
    }
  }

  const filteredShipments =
    filterShipments({
      shipments,
      search,
      status,
      provider,
      date,
    });

  const stats =
    getTrackingStats(filteredShipments);

  return (
    <div className="min-h-screen space-y-5 bg-slate-50 p-4 md:space-y-8 md:p-10">
      <TrackingHeader />

      <TrackingStats stats={stats} />

      <TrackingFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        provider={provider}
        onProviderChange={setProvider}
        date={date}
        onDateChange={setDate}
        syncing={syncing}
        onSync={handleSync}
      />

      <div className="hidden md:block">
        <TrackingTable
          shipments={filteredShipments}
          loading={loading}
          onView={openDrawer}
          onExchange={openExchange}
          onDelete={openDelete}
        />
      </div>

      <div className="md:hidden">
        <TrackingMobileList
          shipments={filteredShipments}
          loading={loading}
          onView={openDrawer}
          onExchange={openExchange}
          onDelete={openDelete}
        />
      </div>

      <TrackingDrawer
        open={drawerOpen}
        shipment={selectedShipment}
        onClose={closeDrawer}
      />

      <ExchangeDrawer
        open={exchangeOpen}
        shipment={selectedShipment}
        onClose={closeExchange}
        onSuccess={loadShipments}
      />

      <DeleteShipmentDialog
        open={deleteOpen}
        shipment={selectedShipment}
        onClose={closeDelete}
        onSuccess={loadShipments}
      />
    </div>
  );
}