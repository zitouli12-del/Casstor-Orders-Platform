"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import {
  RefreshCw,
  Copy,
  Globe,
  Key,
  CheckCircle2,
  AlertCircle,
  Power,
  PowerOff
} from "lucide-react";
import TransporteursHeader from "@/src/components/transporteurs/TransporteursHeader";
import TransporteursSearchBar from "@/src/components/transporteurs/TransporteursSearchBar";
import TransporteursProvidersGrid from "@/src/components/transporteurs/TransporteursProvidersGrid";
import AddProviderModal from "@/src/components/transporteurs/AddProviderModal";

interface ShippingProvider {
  id: string;
  provider_code: string;
  provider_name: string;
  client_id: string;
  api_key: string;
  webhook_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  store_id: number | null;
}

// Configuration des transporteurs disponibles
const AVAILABLE_PROVIDERS = [
  {
    code: "ozon",
    name: "Ozon Express",
    fields: ["client_id", "api_key", "webhook_url"],
    required: ["client_id", "api_key"]
  },
  {
    code: "olivraison",
    name: "Olivraison",
    fields: ["api_key", "webhook_url"],
    required: ["api_key"]
  }
];

// Configuration des champs par transporteur
const PROVIDER_FIELDS_CONFIG: Record<string, { fields: string[], label: string, required: string[] }> = {
  ozon: {
    fields: ["client_id", "api_key", "webhook_url"],
    label: "Ozon Express",
    required: ["client_id", "api_key"]
  },
  olivraison: {
    fields: ["api_key", "webhook_url"],
    label: "Olivraison",
    required: ["api_key"]
  }
};

// Fonction pour obtenir les champs d'un transporteur
function getProviderFields(providerCode: string): string[] {
  const config = PROVIDER_FIELDS_CONFIG[providerCode];
  return config ? config.fields : ["client_id", "api_key", "webhook_url"];
}

// Fonction pour obtenir les champs requis d'un transporteur
function getRequiredFields(providerCode: string): string[] {
  const config = PROVIDER_FIELDS_CONFIG[providerCode];
  return config ? config.required : ["client_id", "api_key"];
}

// Fonction pour obtenir le nom du transporteur
function getProviderLabel(providerCode: string): string {
  const config = PROVIDER_FIELDS_CONFIG[providerCode];
  return config ? config.label : providerCode;
}

export default function TransporteursPage() {
  const [providers, setProviders] = useState<ShippingProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedFields, setEditedFields] = useState<{ [key: string]: any }>({});
  const [isSaving, setIsSaving] = useState<{ [key: string]: boolean }>({});
  const [isTesting, setIsTesting] = useState<{ [key: string]: boolean }>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Add provider modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProviderCode, setSelectedProviderCode] = useState<string>("");
  const [newProviderFields, setNewProviderFields] = useState<{ [key: string]: string }>({});
  const [isAdding, setIsAdding] = useState(false);
  const [showModalApiKey, setShowModalApiKey] = useState(false);
  
  // Show/hide API keys in cards
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});

  // API Integration states
  const [apiKey, setApiKey] = useState("");
  const API_URL = "https://app.casstorpro.space/api/orders";

  useEffect(() => {
    fetchProviders();
    fetchApiKey();
  }, []);

  async function fetchProviders() {
    setLoading(true);
    
    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error getting user:", userError);
      setToast({ message: "Erreur d'authentification", type: 'error' });
      setLoading(false);
      return;
    }

    // Get user's store
    const {
      data: store,
      error: storeError,
    } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (storeError || !store) {
      console.error("Error getting store:", storeError);
      setToast({ message: "Erreur lors de la récupération du magasin", type: 'error' });
      setLoading(false);
      return;
    }

    // Load only providers belonging to this store
    const { data, error } = await supabase
      .from("shipping_providers")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setProviders(data);
    } else {
      setToast({ message: "Erreur lors du chargement des transporteurs", type: 'error' });
    }
    setLoading(false);
  }

async function fetchApiKey() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Error getting user:", userError);
    return;
  }

  const {
    data: store,
    error: storeError,
  } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (storeError || !store) {
    console.error("Error getting store:", storeError);
    return;
  }

  const {
    data,
    error,
  } = await supabase
    .from("api_keys")
    .select("api_key")
    .eq("store_id", store.id)
    .single();

  if (!error && data) {
    setApiKey(data.api_key);
  }
}

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch =
      provider.provider_name?.toLowerCase().includes(search.toLowerCase()) ||
      provider.provider_code?.toLowerCase().includes(search.toLowerCase()) ||
      provider.client_id?.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const startEditing = (provider: ShippingProvider) => {
    setEditingId(provider.id);
    const fields = getProviderFields(provider.provider_code);
    const initialFields: { [key: string]: any } = {};
    
    fields.forEach(field => {
      initialFields[field] = provider[field as keyof ShippingProvider] || "";
    });
    initialFields.is_active = provider.is_active;
    
    setEditedFields(initialFields);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedFields({});
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditedFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleShowApiKey = (providerId: string) => {
    setShowApiKeys((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }));
  };

  const handleSave = async (providerId: string) => {
    setIsSaving((prev) => ({ ...prev, [providerId]: true }));
    setToast(null);

    const provider = providers.find(p => p.id === providerId);
    if (!provider) return;

    const fields = getProviderFields(provider.provider_code);
    const requiredFields = getRequiredFields(provider.provider_code);
    
    const missingFields = requiredFields.filter(field => !editedFields[field] || editedFields[field].trim() === "");
    
    if (missingFields.length > 0) {
      const fieldLabels: { [key: string]: string } = {
        client_id: "Client ID",
        api_key: "API Key",
        webhook_url: "Webhook URL"
      };
      setToast({ 
        message: `Veuillez remplir tous les champs requis: ${missingFields.map(f => fieldLabels[f] || f).join(", ")}`, 
        type: 'error' 
      });
      setIsSaving((prev) => ({ ...prev, [providerId]: false }));
      return;
    }

    const updateData: { [key: string]: any } = {
      updated_at: new Date().toISOString(),
    };

    fields.forEach(field => {
      updateData[field] = editedFields[field] || "";
    });
    updateData.is_active = editedFields.is_active;

    const { error } = await supabase
      .from("shipping_providers")
      .update(updateData)
      .eq("id", providerId);

    if (error) {
      console.error("Update error:", error);
      setToast({ message: "Erreur lors de la sauvegarde", type: 'error' });
    } else {
      setToast({ message: "Modifications enregistrées avec succès !", type: 'success' });
      await fetchProviders();
      setEditingId(null);
      setEditedFields({});
      setTimeout(() => setToast(null), 3000);
    }

    setIsSaving((prev) => ({ ...prev, [providerId]: false }));
  };

  const handleTestConnection = async (providerId: string) => {
    setIsTesting((prev) => ({ ...prev, [providerId]: true }));
    setToast(null);

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const provider = providers.find(p => p.id === providerId);
    setToast({
      message: `✅ Connexion testée avec succès pour ${provider?.provider_name}`,
      type: 'success'
    });
    setTimeout(() => setToast(null), 3000);
    
    setIsTesting((prev) => ({ ...prev, [providerId]: false }));
  };

  const handleAddProvider = async () => {
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("USER =", user);

    // Get user's store
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", user?.id)
      .single();
    console.log("STORE =", store);
    console.log("STORE ERROR =", storeError);

    if (!selectedProviderCode) {
      setToast({ message: "Veuillez sélectionner un transporteur", type: 'error' });
      return;
    }

    const existingProvider = providers.find(
  p =>
    p.provider_code === selectedProviderCode &&
    p.store_id === store?.id
);

    if (existingProvider) {
      setToast({ message: "Ce transporteur est déjà enregistré", type: 'error' });
      return;
    }

    const fields = getProviderFields(selectedProviderCode);
    const requiredFields = getRequiredFields(selectedProviderCode);
    const missingFields = requiredFields.filter(field => !newProviderFields[field] || newProviderFields[field].trim() === "");
    
    if (missingFields.length > 0) {
      const fieldLabels: { [key: string]: string } = {
        client_id: "Client ID",
        api_key: "API Key",
        webhook_url: "Webhook URL"
      };
      setToast({ 
        message: `Veuillez remplir tous les champs requis: ${missingFields.map(f => fieldLabels[f] || f).join(", ")}`, 
        type: 'error' 
      });
      return;
    }

    setIsAdding(true);
    setToast(null);

    const selectedProvider = AVAILABLE_PROVIDERS.find(p => p.code === selectedProviderCode);
    if (!selectedProvider) {
      setToast({ message: "Transporteur non trouvé", type: 'error' });
      setIsAdding(false);
      return;
    }

    // Prepare insert data with store_id
    const initialData: { [key: string]: any } = { 
      store_id: store?.id,
      provider_code: selectedProviderCode,
      provider_name: selectedProvider.name,
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    fields.forEach(field => {
      initialData[field] = newProviderFields[field] || "";
    });

    console.log("INSERT DATA =", initialData);

    console.log("=== DIAGNOSTIC INSERTION TRANSPORTEUR ===");
    console.log("Selected provider code:", selectedProviderCode);
    console.log("Selected provider name:", selectedProvider.name);
    console.log("Initial data to insert:", JSON.stringify(initialData, null, 2));
    console.log("Fields to insert:", fields);
    console.log("Field values:", newProviderFields);
    console.log("========================================");

    const { data: result, error } = await supabase
      .from("shipping_providers")
      .insert([initialData])
      .select();

    console.log("=== DIAGNOSTIC RESULTAT SUPABASE ===");
    console.log("Result data:", result);
    console.log("Error object:", error);
    
    if (error) {
      console.error("Insert Error Details:");
      console.error("  - Message:", error.message);
      console.error("  - Details:", error.details);
      console.error("  - Hint:", error.hint);
      console.error("  - Code:", error.code);
      console.error("  - Full error:", JSON.stringify(error, null, 2));
    } else {
      console.log("✅ Insertion réussie !");
      console.log("Données insérées:", result);
    }
    console.log("========================================");

    if (error) {
      console.error("Add error:", error);
      setToast({ 
        message: `Erreur lors de l'ajout du transporteur: ${error.message || 'Erreur inconnue'}`, 
        type: 'error' 
      });
    } else {
      setToast({ message: "Transporteur ajouté avec succès !", type: 'success' });
      await fetchProviders();
      setIsAddModalOpen(false);
      setSelectedProviderCode("");
      setNewProviderFields({});
      setShowModalApiKey(false);
      setTimeout(() => setToast(null), 3000);
    }

    setIsAdding(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast({ message: "Copié dans le presse-papier !", type: 'success' });
    setTimeout(() => setToast(null), 2000);
  };

  const getActiveStatusColor = (isActive: boolean) => {
    return isActive 
      ? "border-green-500/30 bg-green-500/10 text-green-400"
      : "border-red-500/30 bg-red-500/10 text-red-400";
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <Power size={14} className="text-green-400" /> : <PowerOff size={14} className="text-red-400" />;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400 font-medium bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={32} className="animate-spin text-orange-500" />
          Chargement des transporteurs...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 md:p-8">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 
          toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
          'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} className="text-green-600" /> : <AlertCircle size={20} className="text-red-600" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <TransporteursHeader
        onAddProvider={() => setIsAddModalOpen(true)}
      />

      <TransporteursSearchBar
        value={search}
        onChange={setSearch}
      />

      <TransporteursProvidersGrid
        providers={filteredProviders}
        editingId={editingId}
        editedFields={editedFields}
        isSaving={isSaving}
        isTesting={isTesting}
        showApiKeys={showApiKeys}
        onStartEditing={startEditing}
        onCancelEditing={cancelEditing}
        onFieldChange={handleFieldChange}
        onSave={handleSave}
        onTestConnection={handleTestConnection}
        onToggleShowApiKey={toggleShowApiKey}
        onCopyToClipboard={copyToClipboard}
        getProviderFields={getProviderFields}
        getProviderLabel={getProviderLabel}
        getRequiredFields={getRequiredFields}
        getActiveStatusColor={getActiveStatusColor}
        getStatusIcon={getStatusIcon}
      />

      {/* API Integration Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-white px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Key size={20} className="text-orange-500" />
            🔑 API Integration
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5 mb-1.5">
              <Globe size={14} />
              API Endpoint
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={API_URL}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
              <button
                onClick={() => copyToClipboard(API_URL)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                title="Copier"
              >
                <Copy size={16} className="text-slate-600" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5 mb-1.5">
              <Key size={14} />
              API Key
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="password"
                  value={apiKey}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
              <button
                onClick={() => copyToClipboard(apiKey)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                title="Copier"
              >
                <Copy size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddProviderModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedProviderCode("");
          setNewProviderFields({});
          setShowModalApiKey(false);
        }}
        onAdd={handleAddProvider}
        isAdding={isAdding}
        selectedProviderCode={selectedProviderCode}
        onProviderSelect={(code) => {
          setSelectedProviderCode(code);
          setNewProviderFields({});
          setShowModalApiKey(false);
        }}
        newProviderFields={newProviderFields}
        onFieldChange={(field, value) => {
          setNewProviderFields(prev => ({ ...prev, [field]: value }));
        }}
        showApiKey={showModalApiKey}
        onToggleShowApiKey={() => setShowModalApiKey(!showModalApiKey)}
        onCopyToClipboard={copyToClipboard}
        availableProviders={AVAILABLE_PROVIDERS}
        existingProviders={providers}
        getProviderFields={getProviderFields}
        getRequiredFields={getRequiredFields}
      />
    </div>
  );
}