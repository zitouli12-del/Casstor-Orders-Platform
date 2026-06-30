"use client";

import OrdersTable from "@/src/components/confirmation/OrdersTable";
import SearchBar from "@/src/components/confirmation/SearchBar";
import DashboardCards from "@/src/components/confirmation/DashboardCards";
import ConfirmationHeader from "@/src/components/confirmation/ConfirmationHeader";
import { fetchOrders } from "@/src/services/orders/fetchOrders";
import { updateOrder } from "@/src/services/orders/updateOrder";
import CityAutocomplete from "@/src/components/confirmation/CityAutocomplete";
import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { 
  CheckCircle2, 
  PhoneOff, 
  Package,
  Search,
  Save,
  Phone,
  MapPin,
  User,
  Hash,
  Calendar,
  Clock,
  CreditCard,
  Tag,
  Palette,
  Maximize2,
  FileText,
  Globe,
  Eye,
  X,
  AlertCircle,
  ChevronDown,
  Edit,
  Truck,
  CheckSquare,
  Square,
  Radio,
  Circle
} from "lucide-react";
import EditOrderModal from "@/src/components/confirmation/modal/EditOrderModal";
import ShippingPopup from "@/src/components/confirmation/ShippingPopup";

export default function ConfirmationPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedFields, setEditedFields] = useState<{ [key: string]: any }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  
  // Shipping popup state
  const [isShippingPopupOpen, setIsShippingPopupOpen] = useState(false);
  const [selectedShippingOrders, setSelectedShippingOrders] = useState<string[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<'ozon' | 'olivraison'>('ozon');
  const [shippingToast, setShippingToast] = useState<{ message: string; type: 'success' } | null>(null);

useEffect(() => {
  loadOrders();
}, []);


async function loadOrders() {
  setLoading(true);

  const data = await fetchOrders();

  setOrders(data);

  setLoading(false);
}

  const filteredOrders = orders.filter((order) => {
    // Filter out orders with status "hors-confirmation"
    if (order.status === "hors-confirmation") return false;
    
    const matchesSearch =
      order.name?.toLowerCase().includes(search.toLowerCase()) ||
      order.phone?.includes(search) ||
      order.city?.toLowerCase().includes(search.toLowerCase()) ||
      order.address?.toLowerCase().includes(search.toLowerCase()) ||
      order.color?.toLowerCase().includes(search.toLowerCase()) ||
      order.size?.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

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
    livreur_comment: order.livreur_comment || "",
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

  const handleFieldChange = (field: string, value: any) => {
    setEditedFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStatusChange = async (
  orderId: number,
  newStatus: string
) => {
    setUpdatingStatus(orderId);
    setToast(null);

    const { data, error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select();

    console.log("STATUS UPDATE DATA =", data);
    console.log("STATUS UPDATE ERROR =", error);

    if (error) {
      console.error("Status update error:", error);
      setToast({ message: "Erreur lors de la mise à jour du statut", type: 'error' });
    } else {
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus, updated_at: new Date().toISOString() } : order
        )
      );
      setToast({ message: "Statut mis à jour avec succès !", type: 'success' });
      
      // Clear toast after 3 seconds
      setTimeout(() => setToast(null), 3000);
    }
    
    setUpdatingStatus(null);
  };

  const handleSave = async () => {
    if (!selectedOrder) return;
    
    setIsSaving(true);
    setToast(null);

    try {
      await updateOrder(selectedOrder, editedFields);
      setToast({ message: "Modifications enregistrées avec succès !", type: 'success' });
      // Update selected order with new values
      setSelectedOrder({
        ...selectedOrder,
        ...{
          name: editedFields.name,
          phone: editedFields.phone,
          city: editedFields.city,
          address: editedFields.address,
          color: editedFields.color,
          size: editedFields.size,
          price: isNaN(parseInt(editedFields.price, 10)) ? 0 : parseInt(editedFields.price, 10),
          notes: editedFields.notes,
          livreur_comment: editedFields.livreur_comment,
          updated_at: new Date().toISOString(),
        },
      });
      // Refresh orders data
      const refreshedOrders = await fetchOrders();
      setOrders(refreshedOrders);
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error("Update error:", error);
      setToast({ message: "Erreur lors de la sauvegarde", type: 'error' });
    }
    
    setIsSaving(false);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      nouvelle: "border-blue-500/30 focus:border-blue-500 bg-blue-500/10 text-blue-400",
      confirmé: "border-green-500/30 focus:border-green-500 bg-green-500/10 text-green-400",
      "ps-reponse": "border-yellow-500/30 focus:border-yellow-500 bg-yellow-500/10 text-yellow-400",
      "hors-confirmation": "border-gray-500/30 focus:border-gray-500 bg-gray-500/10 text-gray-400",
    };
    return colors[status as keyof typeof colors] || colors.nouvelle;
  };

  // Calculate dashboard stats from all orders (excluding hors-confirmation)
  const totalNouvelle = orders.filter((o) => o.status === "nouvelle").length;
  const totalConfirme = orders.filter((o) => o.status === "confirmé").length;
  const totalPsReponse = orders.filter((o) => o.status === "ps-reponse").length;
  const totalOrders = orders.filter((o) => o.status !== "hors-confirmation").length;

  // Shipping popup handlers
  const openShippingPopup = () => {
    setIsShippingPopupOpen(true);
    // Reset selections
    setSelectedShippingOrders([]);
    setSelectedCarrier('ozon');
    setShippingToast(null);
  };

  const closeShippingPopup = () => {
    setIsShippingPopupOpen(false);
    setSelectedShippingOrders([]);
    setSelectedCarrier('ozon');
    setShippingToast(null);
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedShippingOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleAllOrders = () => {
    const confirmedOrders = orders.filter(o => o.status === "confirmé");
    const allSelected = confirmedOrders.every(o => selectedShippingOrders.includes(o.id));
    
    if (allSelected) {
      setSelectedShippingOrders([]);
    } else {
      setSelectedShippingOrders(confirmedOrders.map(o => o.id));
    }
  };

  const handleShipOrders = async () => {
    if (selectedShippingOrders.length === 0) return;

    try {
const endpoint =
  "/api/shipping";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
body: JSON.stringify({
  orderIds: selectedShippingOrders,
  provider: selectedCarrier,
})
      });

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

      const errorCount =
        result.errorCount || 0;

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

  // Get confirmed orders for shipping
  const confirmedOrders = orders.filter(o => o.status === "confirmé");

if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
        <span className="text-slate-600 font-medium">
          Chargement des commandes...
        </span>
      </div>
    </div>
  );
}

  return (
    <div className="space-y-8 bg-slate-50 min-h-screen text-slate-900 p-6">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-green-500/90 border border-green-400 text-white' : 'bg-red-500/90 border border-red-400 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Shipping Toast Notification */}
      {shippingToast && (
        <div className="fixed top-4 right-4 z-[60] p-4 rounded-lg shadow-xl flex items-center gap-3 bg-green-500/90 border border-green-400 text-white">
          <CheckCircle2 size={20} />
          <span className="font-medium">{shippingToast.message}</span>
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
<OrdersTable
  filteredOrders={filteredOrders}
  updatingStatus={updatingStatus}
  handleStatusChange={handleStatusChange}
  openModal={openModal}
  getStatusColor={getStatusColor}
/>

      {/* Modal */}
      <EditOrderModal
        isOpen={isModalOpen}
        selectedOrder={selectedOrder}
        editedFields={editedFields}
        isSaving={isSaving}
        handleFieldChange={handleFieldChange}
        handleSave={handleSave}
        closeModal={closeModal}
      />

      {/* Shipping Popup */}
      <ShippingPopup
        isOpen={isShippingPopupOpen}
        confirmedOrders={confirmedOrders}
        selectedShippingOrders={selectedShippingOrders}
        selectedCarrier={selectedCarrier}
        setSelectedCarrier={setSelectedCarrier}
        toggleOrderSelection={toggleOrderSelection}
        toggleAllOrders={toggleAllOrders}
        handleShipOrders={handleShipOrders}
        closeShippingPopup={closeShippingPopup}
      />
    </div>
  );
}