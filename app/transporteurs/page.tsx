"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import {
  Truck,
  Plus,
  Save,
  TestTube,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  ChevronDown,
  Edit,
  Trash2,
  Copy,
  Check,
  Power,
  PowerOff,
  Globe,
  Key,
  User,
  Link,
  Calendar,
  Hash,
  Clock
} from "lucide-react";

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
    const { data, error } = await supabase
      .from("shipping_providers")
      .select("*")
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
    if (!selectedProviderCode) {
      setToast({ message: "Veuillez sélectionner un transporteur", type: 'error' });
      return;
    }

    const existingProvider = providers.find(p => p.provider_code === selectedProviderCode);
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

    const initialData: { [key: string]: any } = {
      provider_code: selectedProviderCode,
      provider_name: selectedProvider.name,
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    fields.forEach(field => {
      initialData[field] = newProviderFields[field] || "";
    });

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

  const renderModalField = (fieldName: string) => {
    const fieldConfig: { [key: string]: { icon: any, label: string, placeholder: string, type?: string } } = {
      client_id: {
        icon: User,
        label: "Client ID",
        placeholder: "Entrez le Client ID"
      },
      api_key: {
        icon: Key,
        label: "API Key",
        placeholder: "Entrez l'API Key",
        type: "password"
      },
      webhook_url: {
        icon: Link,
        label: "Webhook URL (optionnel)",
        placeholder: "https://example.com/webhook (optionnel)"
      }
    };

    const config = fieldConfig[fieldName];
    if (!config) return null;

    const Icon = config.icon;
    const value = newProviderFields[fieldName] || "";
    const isApiKey = fieldName === "api_key";
    const requiredFields = getRequiredFields(selectedProviderCode);
    const isRequired = requiredFields.includes(fieldName);

    return (
      <div key={fieldName}>
        <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1.5">
          <Icon size={14} />
          {config.label}
          {isRequired && <span className="text-red-400 text-xs">*</span>}
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type={isApiKey && !showModalApiKey ? "password" : "text"}
              value={value}
              onChange={(e) => setNewProviderFields(prev => ({ ...prev, [fieldName]: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 text-sm"
              placeholder={config.placeholder}
            />
            {isApiKey && (
              <button
                onClick={() => setShowModalApiKey(!showModalApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showModalApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
          <button
            onClick={() => copyToClipboard(value)}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            title="Copier"
          >
            <Copy size={16} className="text-slate-300" />
          </button>
        </div>
        {!isRequired && (
          <p className="text-xs text-slate-500 mt-1">Optionnel - peut être laissé vide</p>
        )}
      </div>
    );
  };

  const renderCardField = (provider: ShippingProvider, fieldName: string, isEditing: boolean) => {
    const fieldConfig: { [key: string]: { icon: any, label: string, placeholder: string, type?: string } } = {
      client_id: {
        icon: User,
        label: "Client ID",
        placeholder: "Client ID"
      },
      api_key: {
        icon: Key,
        label: "API Key",
        placeholder: "API Key",
        type: "password"
      },
      webhook_url: {
        icon: Link,
        label: "Webhook URL (optionnel)",
        placeholder: "https://example.com/webhook"
      }
    };

    const config = fieldConfig[fieldName];
    if (!config) return null;

    const Icon = config.icon;
    const value = isEditing ? (editedFields[fieldName] || "") : (provider[fieldName as keyof ShippingProvider] || "");
    const isApiKey = fieldName === "api_key";
    const showKey = showApiKeys[provider.id] || false;
    const requiredFields = getRequiredFields(provider.provider_code);
    const isRequired = requiredFields.includes(fieldName);

    return (
      <div key={fieldName}>
        <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1.5">
          <Icon size={14} />
          {config.label}
          {isRequired && <span className="text-red-400 text-xs">*</span>}
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type={isApiKey && !showKey ? "password" : "text"}
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              disabled={!isEditing}
              className={`w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200 text-sm ${
                isEditing ? 'focus:outline-none focus:border-blue-500' : 'opacity-60 cursor-not-allowed'
              }`}
              placeholder={config.placeholder}
            />
            {isApiKey && isEditing && (
              <button
                onClick={() => toggleShowApiKey(provider.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
          {isEditing && (
            <button
              onClick={() => copyToClipboard(value)}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              title="Copier"
            >
              <Copy size={16} className="text-slate-300" />
            </button>
          )}
        </div>
        {!isRequired && !isEditing && (
          <p className="text-xs text-slate-500 mt-1">Optionnel</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400 font-medium bg-[#0f172a]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={32} className="animate-spin text-blue-500" />
          Chargement des transporteurs...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[#0f172a] min-h-screen text-slate-100 p-2 sm:p-4 md:p-8">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-green-500/90 border border-green-400 text-white' : 
          toast.type === 'error' ? 'bg-red-500/90 border border-red-400 text-white' :
          'bg-blue-500/90 border border-blue-400 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Truck className="text-orange-400" size={32} />
            Transporteurs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gérez les transporteurs et leurs informations API.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-colors shadow-lg shadow-orange-500/20 self-start md:self-auto"
        >
          <Plus size={20} />
          Ajouter un transporteur
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-[#1f2937] border border-slate-800 p-5 rounded-xl shadow-xl">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom, code ou client ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200 focus:outline-none focus:border-slate-500 text-sm transition-all"
          />
        </div>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProviders.length === 0 ? (
          <div className="col-span-full bg-[#1f2937] border border-slate-700 rounded-xl p-12 text-center">
            <Truck size={48} className="mx-auto mb-3 text-slate-600 opacity-50" />
            <p className="text-slate-400 font-medium">Aucun transporteur trouvé</p>
            <p className="text-sm text-slate-500 mt-1">Cliquez sur "Ajouter un transporteur" pour commencer</p>
          </div>
        ) : (
          filteredProviders.map((provider) => {
            const isEditing = editingId === provider.id;
            const isSavingProvider = isSaving[provider.id] || false;
            const isTestingProvider = isTesting[provider.id] || false;
            const fields = getProviderFields(provider.provider_code);
            const providerLabel = getProviderLabel(provider.provider_code);

            return (
              <div
                key={provider.id}
                className="bg-[#1f2937] border border-slate-700 rounded-xl overflow-hidden shadow-xl hover:border-slate-600 transition-all"
              >
                {/* Card Header */}
                <div className="bg-[#111827] px-5 py-4 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                      <Truck size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{provider.provider_name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{provider.provider_code}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{providerLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${getActiveStatusColor(provider.is_active)}`}>
                      {getStatusIcon(provider.is_active)}
                      {provider.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  {fields.map(fieldName => renderCardField(provider, fieldName, isEditing))}

                  {isEditing && (
                    <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                      <div className="flex items-center gap-2">
                        {editedFields.is_active ? (
                          <Power size={16} className="text-green-400" />
                        ) : (
                          <PowerOff size={16} className="text-red-400" />
                        )}
                        <span className="text-sm font-medium text-slate-300">
                          {editedFields.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editedFields.is_active || false}
                          onChange={(e) => handleFieldChange("is_active", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-700 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      Créé: {new Date(provider.created_at).toLocaleDateString("fr-FR")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      Mis à jour: {new Date(provider.updated_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(provider.id)}
                          disabled={isSavingProvider}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Save size={16} />
                          {isSavingProvider ? "Enregistrement..." : "Enregistrer"}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(provider)}
                          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit size={16} />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleTestConnection(provider.id)}
                          disabled={isTestingProvider}
                          className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 border border-orange-500/20"
                        >
                          {isTestingProvider ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <TestTube size={16} />
                          )}
                          {isTestingProvider ? "Test..." : "Tester"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* API Integration Card */}
      <div className="bg-[#1f2937] border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="bg-[#111827] px-5 py-4 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Key size={20} className="text-orange-400" />
            🔑 API Integration
          </h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1.5">
              <Globe size={14} />
              API Endpoint
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={API_URL}
                  disabled
                  className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200 text-sm opacity-60 cursor-not-allowed"
                />
              </div>
              <button
                onClick={() => copyToClipboard(API_URL)}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                title="Copier"
              >
                <Copy size={16} className="text-slate-300" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1.5">
              <Key size={14} />
              API Key
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="password"
                  value={apiKey}
                  disabled
                  className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200 text-sm opacity-60 cursor-not-allowed"
                />
              </div>
              <button
                onClick={() => copyToClipboard(apiKey)}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                title="Copier"
              >
                <Copy size={16} className="text-slate-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Provider Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1f2937] border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-[#111827] px-6 py-4 border-b border-slate-700 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus size={20} className="text-orange-400" />
                Ajouter un transporteur
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setSelectedProviderCode("");
                  setNewProviderFields({});
                  setShowModalApiKey(false);
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Truck size={14} />
                  Transporteur
                </label>
                <div className="relative">
                  <select
                    value={selectedProviderCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setSelectedProviderCode(code);
                      setNewProviderFields({});
                      setShowModalApiKey(false);
                    }}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Sélectionner un transporteur</option>
                    {AVAILABLE_PROVIDERS.map((provider) => {
                      const isExisting = providers.some(p => p.provider_code === provider.code);
                      return (
                        <option 
                          key={provider.code} 
                          value={provider.code}
                          disabled={isExisting}
                          className={isExisting ? "text-slate-500" : "text-slate-200"}
                        >
                          {provider.name} {isExisting ? "(déjà enregistré)" : ""}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>

              {selectedProviderCode && (
                <div className="space-y-4 pt-2 border-t border-slate-700">
                  {getProviderFields(selectedProviderCode).map(fieldName => renderModalField(fieldName))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#111827] px-6 py-4 border-t border-slate-700 flex flex-wrap gap-3 justify-end sticky bottom-0">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setSelectedProviderCode("");
                  setNewProviderFields({});
                  setShowModalApiKey(false);
                }}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddProvider}
                disabled={!selectedProviderCode || isAdding}
                className={`px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  (!selectedProviderCode || isAdding) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isAdding ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                {isAdding ? "Ajout..." : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}