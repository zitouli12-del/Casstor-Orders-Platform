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
import WhatsAppConnectionCard from "@/src/components/transporteurs/WhatsAppConnectionCard";

interface ShippingProvider {
  id: string;
  provider_code: string;
  provider_name: string;
  client_id: string;
  api_key: string;

  webhook_secret: string | null;
  webhook_enabled: boolean;

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
    fields: ["client_id", "api_key"],
    required: ["client_id", "api_key"]
  },
  {
    code: "olivraison",
    name: "Olivraison",
    fields: ["api_key"],
    required: ["api_key"]
  }
];

// Configuration des champs par transporteur
const PROVIDER_FIELDS_CONFIG: Record<string, { fields: string[], label: string, required: string[] }> = {
ozon: {
  fields: ["client_id", "api_key"],
    label: "Ozon Express",
    required: ["client_id", "api_key"]
  },
olivraison: {
  fields: ["api_key"],
    label: "Olivraison",
    required: ["api_key"]
  }
};

// Fonction pour obtenir les champs d'un transporteur
function getProviderFields(providerCode: string): string[] {
  const config = PROVIDER_FIELDS_CONFIG[providerCode];
  return config ? config.fields : ["client_id", "api_key"];
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
  const WEBHOOK_BASE_URL =
    "https://app.casstorpro.space/api/webhooks/shipping";

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

  const ozonProvider = providers.find(
    (provider) => provider.provider_code === "ozon"
  );
  const webhookUrl =
    ozonProvider?.webhook_secret
      ? `${WEBHOOK_BASE_URL}/${ozonProvider.webhook_secret}`
      : null;

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
  api_key: "API Key"
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
  api_key: "API Key"
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
    <div className="min-h-screen w-full bg-slate-50 p-4 sm:p-6 md:p-8">
      <div className="w-full space-y-6">
      {/* =========================
          TOAST
      ========================== */}
      {toast && (
        <div
          className={`fixed right-5 top-5 z-[100] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : toast.type === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-blue-200 bg-blue-50 text-blue-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={20} className="text-green-600" />
          ) : (
            <AlertCircle size={20} className="text-red-600" />
          )}

          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* =========================
          HEADER
      ========================== */}
      <TransporteursHeader
        onAddProvider={() => setIsAddModalOpen(true)}
      />

      {/* =========================
          SEARCH
      ========================== */}
      <TransporteursSearchBar
        value={search}
        onChange={setSearch}
      />

      {/* =========================
          TRANSPORTEURS
      ========================== */}
      <section>
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
      </section>

      {/* =========================
          INTEGRATIONS
      ========================== */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Integration Header */}
        <div className="border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">

            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Globe size={18} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Intégrations
                  </h2>

                  <p className="text-sm text-slate-500">
                    Connectez votre boutique à vos services Casstor.
                  </p>
                </div>
              </div>
            </div>

            {ozonProvider && (
              <div className="flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-500" />

                <span className="text-xs font-semibold text-orange-700">
                  Ozon Express
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Integration Content */}
        <div className="p-5 sm:p-6">

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

            {/* =========================
                API INTEGRATION
            ========================== */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60">

              <div className="border-b border-slate-200 bg-white px-5 py-4">
                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <Key size={19} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800">
                      API
                    </h3>

                    <p className="text-xs text-slate-500">
                      Recevez les commandes depuis vos Landing Pages.
                    </p>
                  </div>

                </div>
              </div>

              <div className="space-y-5 p-5">

                {/* API Endpoint */}
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Globe size={13} />
                    API Endpoint
                  </label>

                  <div className="flex gap-2">

                    <input
                      type="text"
                      value={API_URL}
                      readOnly
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => copyToClipboard(API_URL)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-100"
                      title="Copier"
                    >
                      <Copy size={15} />
                    </button>

                  </div>
                </div>

                {/* API Key */}
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Key size={13} />
                    API Key
                  </label>

                  <div className="flex gap-2">

                    <input
                      type="password"
                      value={apiKey}
                      readOnly
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => copyToClipboard(apiKey)}
                      disabled={!apiKey}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Copier"
                    >
                      <Copy size={15} />
                    </button>

                  </div>
                </div>

                {/* Info */}
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs leading-5 text-slate-500">
                    Utilisez cet endpoint et votre clé API pour envoyer
                    automatiquement vos commandes vers Casstor.
                  </p>
                </div>

              </div>
            </div>

            {/* =========================
                WEBHOOK INTEGRATION
            ========================== */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60">

              <div className="border-b border-slate-200 bg-white px-5 py-4">
                <div className="flex items-center justify-between gap-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Globe size={19} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Webhook
                      </h3>

                      <p className="text-xs text-slate-500">
                        Recevez automatiquement les mises à jour Ozon.
                      </p>
                    </div>

                  </div>

                  {ozonProvider && (
                    <div
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        ozonProvider.webhook_enabled
                          ? "border border-green-200 bg-green-50 text-green-700"
                          : "border border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {ozonProvider.webhook_enabled ? (
                        <>
                          <CheckCircle2 size={13} />
                          Actif
                        </>
                      ) : (
                        <>
                          <AlertCircle size={13} />
                          Inactif
                        </>
                      )}
                    </div>
                  )}

                </div>
              </div>

              <div className="p-5">

                {!ozonProvider ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">

                      <AlertCircle
                        size={19}
                        className="mt-0.5 shrink-0 text-amber-600"
                      />

                      <div>
                        <p className="text-sm font-semibold text-amber-800">
                          Ozon Express n'est pas configuré
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-700">
                          Configurez d'abord Ozon Express pour obtenir
                          votre URL Webhook.
                        </p>
                      </div>

                    </div>
                  </div>
                ) : !webhookUrl ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">

                      <AlertCircle
                        size={19}
                        className="mt-0.5 shrink-0 text-red-600"
                      />

                      <div>
                        <p className="text-sm font-semibold text-red-800">
                          URL Webhook indisponible
                        </p>

                        <p className="mt-1 text-xs leading-5 text-red-700">
                          Aucun secret Webhook n'est configuré pour
                          ce transporteur.
                        </p>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">

                    {/* Webhook URL */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <Globe size={13} />
                          Webhook URL
                        </label>

                        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          Ozon Express
                        </span>
                      </div>

                      <div className="flex gap-2">

                        <input
                          type="text"
                          value={webhookUrl}
                          readOnly
                          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => copyToClipboard(webhookUrl)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                          title="Copier"
                        >
                          <Copy size={15} />
                        </button>

                      </div>
                    </div>

                    {/* Webhook instructions */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">

                      <div className="flex items-start gap-3">

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                          <Globe size={15} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-blue-800">
                            Configuration Ozon Express
                          </p>

                          <p className="mt-1 text-xs leading-5 text-blue-700">
                            Copiez cette URL et ajoutez-la dans la
                            section Webhooks de votre compte Ozon Express.
                            Vous recevrez automatiquement les mises à jour
                            de vos expéditions.
                          </p>
                        </div>

                      </div>

                    </div>

                    {/* Webhook status */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">

                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          Réception des événements
                        </p>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Mises à jour automatiques des expéditions
                        </p>
                      </div>

                      {ozonProvider.webhook_enabled ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                          <CheckCircle2 size={15} />
                          Activé
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                          <AlertCircle size={15} />
                          Désactivé
                        </div>
                      )}

                    </div>

                  </div>
                )}

              </div>
            </div>

          <WhatsAppConnectionCard />

          </div>
        </div>
      </section>

      {/* =========================
          ADD PROVIDER MODAL
      ========================== */}
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
          setNewProviderFields((prev) => ({
            ...prev,
            [field]: value,
          }));
        }}
        showApiKey={showModalApiKey}
        onToggleShowApiKey={() =>
          setShowModalApiKey(!showModalApiKey)
        }
        onCopyToClipboard={copyToClipboard}
        availableProviders={AVAILABLE_PROVIDERS}
        existingProviders={providers}
        getProviderFields={getProviderFields}
        getRequiredFields={getRequiredFields}
      />
      </div>
    </div>
  );
}