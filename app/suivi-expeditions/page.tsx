"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

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

  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function loadShipments() {
    try {
      setLoading(true);

      const data = await getShipments();
      setShipments(data);
    } catch (error) {
      console.error(error);
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

  async function handleSync() {
    if (syncing) return;

    try {
      setSyncing(true);

      const response = await fetch("/api/test-tracking");

      if (!response.ok) {
        throw new Error("Synchronization failed.");
      }

      const result = await response.json();

      await loadShipments();

      if (result.updated > 0) {
        toast.success("Synchronisation terminée", {
          description: `${result.processed} expéditions vérifiées • ${result.updated} statuts mis à jour`,
        });
      } else {
        toast.info("Synchronisation terminée", {
          description: `${result.processed} expéditions vérifiées • Aucune mise à jour détectée`,
        });
      }
    } catch (error) {
      console.error(error);

      toast.error("Échec de la synchronisation", {
        description:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue.",
      });
    } finally {
      setSyncing(false);
    }
  }

  const filteredShipments = filterShipments({
    shipments,
    search,
    status,
    provider,
    date,
  });

  const stats = getTrackingStats(filteredShipments);

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

<>
  <div className="hidden md:block">
    <TrackingTable
      shipments={filteredShipments}
      loading={loading}
      onView={openDrawer}
    />
  </div>

  <div className="md:hidden">
    <TrackingMobileList
      shipments={filteredShipments}
      loading={loading}
      onView={openDrawer}
    />
  </div>
</>

      <TrackingDrawer
        open={drawerOpen}
        shipment={selectedShipment}
        onClose={closeDrawer}
      />
    </div>
  );
}