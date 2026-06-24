"use client";

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

export default function ConfirmationPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedFields, setEditedFields] = useState<{ [key: string]: any }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  // Shipping popup state
  const [isShippingPopupOpen, setIsShippingPopupOpen] = useState(false);
  const [selectedShippingOrders, setSelectedShippingOrders] = useState<string[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<'ozon' | 'olivraison'>('ozon');
  const [shippingToast, setShippingToast] = useState<{ message: string; type: 'success' } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function getCurrentStoreId() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("No user found:", userError);
      return null;
    }

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (storeError || !store) {
      console.error("No store found for user:", storeError);
      return null;
    }

    return store.id;
  }

  async function fetchOrders() {
    setLoading(true);
    
    const storeId = await getCurrentStoreId();
    
    if (!storeId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    setToast(null);

    const { error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

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

    const priceValue = parseInt(
  editedFields.price,
  10
);
    const updateData = {
      name: editedFields.name,
      phone: editedFields.phone,
      city: editedFields.city,
      address: editedFields.address,
      color: editedFields.color,
      size: editedFields.size,
      price: isNaN(priceValue) ? 0 : priceValue,
      notes: editedFields.notes,
      livreur_comment: editedFields.livreur_comment,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", selectedOrder.id);

    if (error) {
      console.error("Update error:", error);
      setToast({ message: "Erreur lors de la sauvegarde", type: 'error' });
    } else {
      setToast({ message: "Modifications enregistrées avec succès !", type: 'success' });
      // Update selected order with new values
      setSelectedOrder({
        ...selectedOrder,
        ...updateData,
      });
      // Refresh orders data
      await fetchOrders();
      setTimeout(() => setToast(null), 3000);
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

      await fetchOrders();

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
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400 font-medium bg-[#0f172a]">
        Chargement des commandes...
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[#0f172a] min-h-screen text-slate-100 p-2 sm:p-4 md:p-8">
      
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Phone className="text-green-500" size={32} />
            Gestion des Commandes
          </h1>
          <p className="text-sm text-slate-400 mt-1">Gérez toutes les commandes, modifiez les informations et mettez à jour le statut.</p>
        </div>
        <div className="flex flex-col gap-2 self-start md:self-auto">
          <div className="bg-[#1f2937] border border-slate-800 px-5 py-2.5 rounded-xl flex items-center gap-4 shadow-lg shadow-black/20">
            <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Package size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Commandes</p>
              <p className="text-2xl font-black text-white">{totalOrders}</p>
            </div>
          </div>
          <button
            onClick={openShippingPopup}
            className="bg-[#1f2937] border border-slate-800 px-5 py-2.5 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-black/20 hover:bg-slate-800/50 transition-colors group"
          >
            <Truck size={18} className="text-orange-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
              Expédier les Commandes
            </span>
          </button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1f2937] border border-blue-500/20 p-4 rounded-xl shadow-md">
          <p className="text-xs font-medium text-blue-400 flex items-center gap-2">
            <Package size={14} />
            Nouvelles
          </p>
          <p className="text-2xl font-bold text-white">{totalNouvelle}</p>
        </div>
        <div className="bg-[#1f2937] border border-green-500/20 p-4 rounded-xl shadow-md">
          <p className="text-xs font-medium text-green-400 flex items-center gap-2">
            <CheckCircle2 size={14} />
            Confirmées
          </p>
          <p className="text-2xl font-bold text-white">{totalConfirme}</p>
        </div>
        <div className="bg-[#1f2937] border border-yellow-500/20 p-4 rounded-xl shadow-md">
          <p className="text-xs font-medium text-yellow-400 flex items-center gap-2">
            <PhoneOff size={14} />
            Ps-réponse
          </p>
          <p className="text-2xl font-bold text-white">{totalPsReponse}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#1f2937] border border-slate-800 p-5 rounded-xl shadow-xl">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, ville, adresse, couleur ou taille..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200 focus:outline-none focus:border-slate-500 text-sm transition-all"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#1f2937] border border-slate-700 rounded-xl overflow-hidden shadow-xl max-h-[650px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#111827] sticky top-0 z-20">
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">ID</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Date & Heure</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Client</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Téléphone</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Ville</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Adresse</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Couleur</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Taille</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Prix</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Status</th>
              <th className="border border-slate-700 p-3.5 text-xs font-bold text-slate-400 uppercase whitespace-nowrap text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-slate-300 text-sm">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center p-8 text-slate-500">
                  Aucune commande trouvée
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="border border-slate-700 p-3 text-xs text-slate-400 whitespace-nowrap">#{order.id}</td>
                  <td className="border border-slate-700 p-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(order.created_at).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="border border-slate-700 p-3 font-medium text-white whitespace-nowrap">{order.name}</td>
                  <td className="border border-slate-700 p-3 whitespace-nowrap">{order.phone}</td>
                  <td className="border border-slate-700 p-3 whitespace-nowrap">{order.city}</td>
                  <td className="border border-slate-700 p-3 text-xs max-w-[150px] truncate">{order.address || "-"}</td>
                  <td className="border border-slate-700 p-3 whitespace-nowrap">
                    {order.color ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full border border-slate-600" style={{ backgroundColor: order.color.toLowerCase() }} />
                        <span>{order.color}</span>
                      </div>
                    ) : "-"}
                  </td>
                  <td className="border border-slate-700 p-3 whitespace-nowrap">{order.size || "-"}</td>
                  <td className="border border-slate-700 p-3 font-bold text-green-400 whitespace-nowrap">{order.price || 0} DH</td>
                  <td className="border border-slate-700 p-3 whitespace-nowrap">
                    <div className="relative min-w-[120px]">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingStatus === order.id}
                        className={`w-full px-2.5 py-1.5 pr-8 rounded-lg border text-xs font-semibold appearance-none cursor-pointer transition-all focus:outline-none ${getStatusColor(order.status)} ${updatingStatus === order.id ? 'opacity-50' : ''}`}
                      >
                        <option value="nouvelle" className="bg-[#1f2937] text-blue-400">Nouvelle</option>
                        <option value="confirmé" className="bg-[#1f2937] text-green-400">Confirmé</option>
                        <option value="ps-reponse" className="bg-[#1f2937] text-yellow-400">Ps-réponse</option>
                        <option value="hors-confirmation" className="bg-[#1f2937] text-gray-400">Hors-confirmation</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                  </td>
                  <td className="border border-slate-700 p-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => openModal(order)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 mx-auto"
                    >
                      <Edit size={14} />
                      Modifier
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1f2937] border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-[#111827] px-6 py-4 border-b border-slate-700 sticky top-0 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Edit size={20} className="text-blue-400" />
                      Modification de la commande
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Hash size={12} />
                      #{selectedOrder.id}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar size={12} />
                      Créée: {new Date(selectedOrder.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                    {selectedOrder.updated_at && (
                      <>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={12} />
                          Mise à jour: {new Date(selectedOrder.updated_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <User size={14} />
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={editedFields.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <Phone size={14} />
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={editedFields.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>

{/* City */}
<div>
  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
    <MapPin size={14} />
    Ville
  </label>

  <CityAutocomplete
    value={editedFields.city || ""}
    onChange={(city) =>
      handleFieldChange(
        "city",
        city
      )
    }
  />
</div>

                {/* Product */}
                <div>
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <Tag size={14} />
                    Produit
                  </label>
                  <p className="px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-white text-sm">
                    {selectedOrder.product || "-"}
                  </p>
                </div>

                {/* Color */}
                <div>
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <Palette size={14} />
                    Couleur
                  </label>
                  <input
                    type="text"
                    value={editedFields.color || ""}
                    onChange={(e) => handleFieldChange("color", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Size */}
                <div>
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <Maximize2 size={14} />
                    Taille
                  </label>
                  <input
                    type="text"
                    value={editedFields.size || ""}
                    onChange={(e) => handleFieldChange("size", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Price */}
{/* Price */}
<div>
  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
    <CreditCard size={14} />
    Prix
  </label>

  <input
    type="number"
    step="1"
    min="0"
    value={editedFields.price ?? ""}
    onChange={(e) =>
      handleFieldChange("price", e.target.value)
    }
    className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 text-sm"
  />
</div>

                {/* Source */}
                <div>
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <Globe size={14} />
                    Source
                  </label>
                  <p className="px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-white text-sm">
                    {selectedOrder.source || "-"}
                  </p>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <FileText size={14} />
                    Notes
                  </label>
                  <textarea
                    value={editedFields.notes || ""}
                    onChange={(e) => handleFieldChange("notes", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 text-sm resize-none"
                    placeholder="Ajouter des notes..."
                  />
                </div>

                {/* Commentaire Livreur */}
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <FileText size={14} />
                    Commentaire Livreur
                  </label>
                  <textarea
                    value={editedFields.livreur_comment || ""}
                    onChange={(e) => handleFieldChange("livreur_comment", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 text-sm resize-none"
                    placeholder="Instructions pour le livreur..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 min-w-[150px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Popup */}
      {isShippingPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1f2937] border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Popup Header */}
            <div className="bg-[#111827] px-6 py-4 border-b border-slate-700 sticky top-0 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Truck size={22} className="text-orange-400" />
                    Expédier les Commandes
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Commandes confirmées prêtes à l'expédition
                  </p>
                </div>
                <button
                  onClick={closeShippingPopup}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Popup Body */}
            <div className="p-6 space-y-6">
              {/* Count */}
              <div className="bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-3">
                <p className="text-sm text-slate-300">
                  <span className="font-bold text-white">{confirmedOrders.length}</span> commandes confirmées
                </p>
              </div>

              {/* Select All */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleAllOrders}
                  className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  {confirmedOrders.length > 0 && confirmedOrders.every(o => selectedShippingOrders.includes(o.id)) ? (
                    <CheckSquare size={20} className="text-blue-500" />
                  ) : (
                    <Square size={20} className="text-slate-500" />
                  )}
                  Tout sélectionner
                </button>
              </div>

              {/* Orders List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {confirmedOrders.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Package size={40} className="mx-auto mb-2 opacity-30" />
                    <p>Aucune commande confirmée</p>
                  </div>
                ) : (
                  confirmedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center gap-3 p-3 bg-[#0f172a] border border-slate-700 rounded-lg hover:border-slate-600 transition-colors cursor-pointer"
                      onClick={() => toggleOrderSelection(order.id)}
                    >
                      {selectedShippingOrders.includes(order.id) ? (
                        <CheckSquare size={18} className="text-blue-500 flex-shrink-0" />
                      ) : (
                        <Square size={18} className="text-slate-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-mono text-xs text-slate-400">#{order.id}</span>
                        <span className="font-medium text-white">{order.name}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-300">{order.city}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-bold text-green-400">{order.price || 0} DH</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Carrier Selection */}
              <div className="space-y-3 bg-[#0f172a] border border-slate-700 rounded-lg p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Transporteur
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="carrier"
                      value="ozon"
                      checked={selectedCarrier === 'ozon'}
                      onChange={() => setSelectedCarrier('ozon')}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-sm font-medium text-slate-300">Ozon Express</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="carrier"
                      value="olivraison"
                      checked={selectedCarrier === 'olivraison'}
                      onChange={() => setSelectedCarrier('olivraison')}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-sm font-medium text-slate-300">Olivraison</span>
                  </label>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-3 space-y-1">
                <p className="text-sm flex justify-between">
                  <span className="text-slate-400">Commandes sélectionnées :</span>
                  <span className="font-bold text-white">{selectedShippingOrders.length}</span>
                </p>
                <p className="text-sm flex justify-between">
                  <span className="text-slate-400">Transporteur :</span>
                  <span className="font-medium text-white">
                    {selectedCarrier === 'ozon' ? 'Ozon Express' : 'Olivraison'}
                  </span>
                </p>
              </div>
            </div>

            {/* Popup Footer */}
            <div className="bg-[#111827] px-6 py-4 border-t border-slate-700 flex flex-wrap gap-3 justify-end">
              <button
                onClick={closeShippingPopup}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleShipOrders}
                disabled={selectedShippingOrders.length === 0}
                className={`px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  selectedShippingOrders.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Truck size={18} />
                Expédier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}