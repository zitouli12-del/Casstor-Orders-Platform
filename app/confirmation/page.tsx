"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

import { supabase } from "@/src/lib/supabase";

import { getBlacklist } from "@/src/services/blacklist/getBlacklist";
import { BlacklistEntry } from "@/src/services/blacklist/getBlacklistEntryByPhone";
import { getShipments } from "@/src/services/tracking/getShipments";
import { fetchOrders } from "@/src/services/orders/fetchOrders";
import { updateOrder } from "@/src/services/orders/updateOrder";

import MobileOrdersList from "@/src/components/confirmation/MobileOrdersList";
import OrdersTable from "@/src/components/confirmation/OrdersTable";
import SearchBar from "@/src/components/confirmation/SearchBar";
import DashboardCards from "@/src/components/confirmation/DashboardCards";
import ConfirmationHeader from "@/src/components/confirmation/ConfirmationHeader";
import EditOrderModal from "@/src/components/confirmation/modal/EditOrderModal";
import ShippingPopup from "@/src/components/confirmation/ShippingPopup";
import ConfirmStatusChangeModal from "@/src/components/confirmation/ConfirmStatusChangeModal";

const ORDERS_PER_PAGE = 10;

const HIDDEN_CONFIRMATION_STATUSES = [
  "annule",
  "doublon",
  "hors-confirmation",
];

const CONFIRMATION_REQUIRED_STATUSES = [
  "annule",
  "doublon",
  "hors-confirmation",
];

export default function ConfirmationPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);

  const [blacklist, setBlacklist] = useState<
    BlacklistEntry[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedOrder, setSelectedOrder] =
    useState<any>(null);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editedFields, setEditedFields] = useState<{
    [key: string]: any;
  }>({});

  const [isSaving, setIsSaving] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [updatingStatus, setUpdatingStatus] =
    useState<number | null>(null);

  const [
    pendingStatusChange,
    setPendingStatusChange,
  ] = useState<{
    orderId: number;
    newStatus: string;
  } | null>(null);

  const [
    isShippingPopupOpen,
    setIsShippingPopupOpen,
  ] = useState(false);

  const [
    selectedShippingOrders,
    setSelectedShippingOrders,
  ] = useState<string[]>([]);

  const [selectedCarrier, setSelectedCarrier] =
    useState<"ozon" | "olivraison">("ozon");

  const [shippingToast, setShippingToast] =
    useState<{
      message: string;
      type: "success";
    } | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);

    try {
      const [
        ordersData,
        shipmentsData,
        blacklistData,
      ] = await Promise.all([
        fetchOrders(),
        getShipments(),
        getBlacklist(),
      ]);

      setOrders(ordersData);
      setShipments(shipmentsData);
      setBlacklist(blacklistData);
    } catch (error) {
      console.error(
        "LOAD CONFIRMATION DATA FAILED =",
        error
      );

      setOrders([]);
      setShipments([]);
      setBlacklist([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (
      HIDDEN_CONFIRMATION_STATUSES.includes(
        order.status
      )
    ) {
      return false;
    }

    const normalizedSearch = search.toLowerCase();

    const matchesSearch =
      order.name
        ?.toLowerCase()
        .includes(normalizedSearch) ||
      order.phone?.includes(search) ||
      order.city
        ?.toLowerCase()
        .includes(normalizedSearch) ||
      order.address
        ?.toLowerCase()
        .includes(normalizedSearch) ||
      order.color
        ?.toLowerCase()
        .includes(normalizedSearch) ||
      order.size
        ?.toLowerCase()
        .includes(normalizedSearch);

    return matchesSearch;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredOrders.length / ORDERS_PER_PAGE
    )
  );

  const startIndex =
    (currentPage - 1) * ORDERS_PER_PAGE;

  const paginatedOrders = filteredOrders.slice(
    startIndex,
    startIndex + ORDERS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openModal = (order: any) => {
    setSelectedOrder(order);

    setEditedFields({
      name: order.name || "",
      phone: order.phone || "",
      city: order.city || "",
      address: order.address || "",
      color: order.color || "",
      size: order.size || "",
      price: order.price ?? "",
      notes: order.notes || "",
      livreur_comment:
        order.livreur_comment || "",
    });

    setToast(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    setEditedFields({});
    setToast(null);
  };

  const handleFieldChange = (
    field: string,
    value: any
  ) => {
    setEditedFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateStatus = async (
    orderId: number,
    newStatus: string
  ) => {
    setUpdatingStatus(orderId);
    setToast(null);

    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: now,
        })
        .eq("id", orderId)
        .select();

      console.log("STATUS UPDATE DATA =", data);
      console.log("STATUS UPDATE ERROR =", error);

      if (error) {
        throw error;
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                updated_at: now,
              }
            : order
        )
      );

      setToast({
        message:
          "Statut mis à jour avec succès !",
        type: "success",
      });

      setTimeout(() => {
        setToast(null);
      }, 3000);

      return true;
    } catch (error) {
      console.error(
        "STATUS UPDATE FAILED =",
        error
      );

      setToast({
        message:
          "Erreur lors de la mise à jour du statut",
        type: "error",
      });

      return false;
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleStatusChange = (
    orderId: number,
    newStatus: string
  ) => {
    const currentOrder = orders.find(
      (order) => order.id === orderId
    );

    if (!currentOrder) {
      return;
    }

    if (currentOrder.status === newStatus) {
      return;
    }

    if (
      CONFIRMATION_REQUIRED_STATUSES.includes(
        newStatus
      )
    ) {
      setPendingStatusChange({
        orderId,
        newStatus,
      });

      return;
    }

    void updateStatus(orderId, newStatus);
  };

  const handleCloseStatusConfirmation = () => {
    if (updatingStatus !== null) {
      return;
    }

    setPendingStatusChange(null);
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange) {
      return;
    }

    const { orderId, newStatus } =
      pendingStatusChange;

    const success = await updateStatus(
      orderId,
      newStatus
    );

    if (!success) {
      return;
    }

    setPendingStatusChange(null);
  };

  const handleSave = async () => {
    if (!selectedOrder) return;

    setIsSaving(true);
    setToast(null);

    try {
      await updateOrder(
        selectedOrder,
        editedFields
      );

      setToast({
        message:
          "Modifications enregistrées avec succès !",
        type: "success",
      });

      setSelectedOrder({
        ...selectedOrder,
        name: editedFields.name,
        phone: editedFields.phone,
        city: editedFields.city,
        address: editedFields.address,
        color: editedFields.color,
        size: editedFields.size,
        price: isNaN(
          parseInt(editedFields.price, 10)
        )
          ? 0
          : parseInt(editedFields.price, 10),
        notes: editedFields.notes,
        livreur_comment:
          editedFields.livreur_comment,
        updated_at: new Date().toISOString(),
      });

      const refreshedOrders = await fetchOrders();

      setOrders(refreshedOrders);

      setTimeout(() => {
        setToast(null);
      }, 3000);
    } catch (error) {
      console.error("Update error:", error);

      setToast({
        message: "Erreur lors de la sauvegarde",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      nouvelle:
        "border-blue-500/30 focus:border-blue-500 bg-blue-500/10 text-blue-600",

      confirmé:
        "border-green-500/30 focus:border-green-500 bg-green-500/10 text-green-600",

      "ps-reponse":
        "border-yellow-500/30 focus:border-yellow-500 bg-yellow-500/10 text-yellow-600",

      injoignable:
        "border-red-500/30 focus:border-red-500 bg-red-500/10 text-red-600",

      "a-rappeler":
        "border-amber-500/30 focus:border-amber-500 bg-amber-500/10 text-amber-600",

      reporte:
        "border-violet-500/30 focus:border-violet-500 bg-violet-500/10 text-violet-600",

      annule:
        "border-rose-500/30 focus:border-rose-500 bg-rose-500/10 text-rose-600",

      doublon:
        "border-orange-500/30 focus:border-orange-500 bg-orange-500/10 text-orange-600",

      "hors-confirmation":
        "border-gray-500/30 focus:border-gray-500 bg-gray-500/10 text-gray-500",
    };

    return (
      colors[status as keyof typeof colors] ||
      colors.nouvelle
    );
  };

  const totalNouvelle = orders.filter(
    (order) => order.status === "nouvelle"
  ).length;

  const totalConfirme = orders.filter(
    (order) => order.status === "confirmé"
  ).length;

  const totalPsReponse = orders.filter(
    (order) => order.status === "ps-reponse"
  ).length;

  const totalOrders = orders.filter(
    (order) =>
      !HIDDEN_CONFIRMATION_STATUSES.includes(
        order.status
      )
  ).length;

  const openShippingPopup = () => {
    setIsShippingPopupOpen(true);
    setSelectedShippingOrders([]);
    setSelectedCarrier("ozon");
    setShippingToast(null);
  };

  const closeShippingPopup = () => {
    setIsShippingPopupOpen(false);
    setSelectedShippingOrders([]);
    setSelectedCarrier("ozon");
    setShippingToast(null);
  };

  const toggleOrderSelection = (
    orderId: string
  ) => {
    setSelectedShippingOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const confirmedOrders = orders.filter(
    (order) => order.status === "confirmé"
  );

  const toggleAllOrders = () => {
    const allSelected = confirmedOrders.every(
      (order) =>
        selectedShippingOrders.includes(order.id)
    );

    if (allSelected) {
      setSelectedShippingOrders([]);
      return;
    }

    setSelectedShippingOrders(
      confirmedOrders.map((order) => order.id)
    );
  };

  const handleShipOrders = async () => {
    if (selectedShippingOrders.length === 0) {
      return;
    }

    try {
      const response = await fetch(
        "/api/shipping",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderIds: selectedShippingOrders,
            provider: selectedCarrier,
          }),
        }
      );

      const text = await response.text();

      console.log("API RESPONSE =", text);

      const result = JSON.parse(text);

      if (!result.success) {
        throw new Error(
          result.error || "Erreur expédition"
        );
      }

      const successCount =
        result.successCount || 0;

      const errorCount = result.errorCount || 0;

      setShippingToast({
        message:
          `${successCount} colis expédiés avec succès` +
          (errorCount > 0
            ? ` (${errorCount} erreurs)`
            : ""),
        type: "success",
      });

      const refreshedOrders = await fetchOrders();

      setOrders(refreshedOrders);

      setTimeout(() => {
        closeShippingPopup();
        setShippingToast(null);
      }, 2500);
    } catch (error: any) {
      alert(
        error.message ||
          "Erreur lors de l'expédition"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />

          <span className="font-medium text-slate-600">
            Chargement des commandes.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8 bg-slate-50 p-6 text-slate-900">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 flex items-center gap-3 rounded-lg border p-4 text-white shadow-xl ${
            toast.type === "success"
              ? "border-green-400 bg-green-500/90"
              : "border-red-400 bg-red-500/90"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}

          <span className="font-medium">
            {toast.message}
          </span>
        </div>
      )}

      {shippingToast && (
        <div className="fixed right-4 top-4 z-[60] flex items-center gap-3 rounded-lg border border-green-400 bg-green-500/90 p-4 text-white shadow-xl">
          <CheckCircle2 size={20} />

          <span className="font-medium">
            {shippingToast.message}
          </span>
        </div>
      )}

      <ConfirmationHeader
        totalOrders={totalOrders}
        onOpenShipping={openShippingPopup}
      />

      <DashboardCards
        totalNouvelle={totalNouvelle}
        totalConfirme={totalConfirme}
        totalPsReponse={totalPsReponse}
      />

      <SearchBar
        value={search}
        onChange={setSearch}
      />

      <>
        <div className="hidden md:block">
          <OrdersTable
            filteredOrders={paginatedOrders}
            allOrders={orders}
            allShipments={shipments}
            blacklist={blacklist}
            updatingStatus={updatingStatus}
            handleStatusChange={handleStatusChange}
            openModal={openModal}
            getStatusColor={getStatusColor}
          />

          {filteredOrders.length >
            ORDERS_PER_PAGE && (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Affichage{" "}
                <span className="font-semibold text-slate-800">
                  {startIndex + 1}
                </span>
                {" - "}
                <span className="font-semibold text-slate-800">
                  {Math.min(
                    startIndex + ORDERS_PER_PAGE,
                    filteredOrders.length
                  )}
                </span>
                {" sur "}
                <span className="font-semibold text-slate-800">
                  {filteredOrders.length}
                </span>
                {" commandes"}
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1)
                    )
                  }
                  disabled={currentPage === 1}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Précédent
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() =>
                      setCurrentPage(page)
                    }
                    className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors ${
                      currentPage === page
                        ? "bg-orange-500 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(
                        totalPages,
                        page + 1
                      )
                    )
                  }
                  disabled={
                    currentPage === totalPages
                  }
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="md:hidden">
          <MobileOrdersList
            filteredOrders={filteredOrders}
            allOrders={orders}
            allShipments={shipments}
            blacklist={blacklist}
            updatingStatus={updatingStatus}
            handleStatusChange={handleStatusChange}
            openModal={openModal}
            getStatusColor={getStatusColor}
          />
        </div>
      </>

      <EditOrderModal
        isOpen={isModalOpen}
        selectedOrder={selectedOrder}
        editedFields={editedFields}
        isSaving={isSaving}
        handleFieldChange={handleFieldChange}
        handleSave={handleSave}
        closeModal={closeModal}
      />

      <ShippingPopup
        isOpen={isShippingPopupOpen}
        confirmedOrders={confirmedOrders}
        selectedShippingOrders={
          selectedShippingOrders
        }
        selectedCarrier={selectedCarrier}
        setSelectedCarrier={setSelectedCarrier}
        toggleOrderSelection={
          toggleOrderSelection
        }
        toggleAllOrders={toggleAllOrders}
        handleShipOrders={handleShipOrders}
        closeShippingPopup={closeShippingPopup}
      />

      <ConfirmStatusChangeModal
        open={pendingStatusChange !== null}
        status={
          pendingStatusChange?.newStatus ?? null
        }
        orderId={
          pendingStatusChange?.orderId ?? null
        }
        loading={
          pendingStatusChange !== null &&
          updatingStatus ===
            pendingStatusChange.orderId
        }
        onClose={handleCloseStatusConfirmation}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
}