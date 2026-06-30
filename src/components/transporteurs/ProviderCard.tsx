import {
  Truck,
  Save,
  TestTube,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Edit,
  Copy,
  Power,
  PowerOff,
  User,
  Key,
  Link,
  Calendar,
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
  store_id: number | null;
}

interface ProviderCardProps {
  provider: ShippingProvider;
  isEditing: boolean;
  editedFields: { [key: string]: any };
  isSaving: boolean;
  isTesting: boolean;
  showApiKey: boolean;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onFieldChange: (field: string, value: any) => void;
  onSave: () => void;
  onTestConnection: () => void;
  onToggleShowApiKey: () => void;
  onCopyToClipboard: (text: string) => void;
  getProviderFields: (providerCode: string) => string[];
  getProviderLabel: (providerCode: string) => string;
  getRequiredFields: (providerCode: string) => string[];
  getActiveStatusColor: (isActive: boolean) => string;
  getStatusIcon: (isActive: boolean) => React.ReactNode;
}

export default function ProviderCard({
  provider,
  isEditing,
  editedFields,
  isSaving,
  isTesting,
  showApiKey,
  onStartEditing,
  onCancelEditing,
  onFieldChange,
  onSave,
  onTestConnection,
  onToggleShowApiKey,
  onCopyToClipboard,
  getProviderFields,
  getProviderLabel,
  getRequiredFields,
  getActiveStatusColor,
  getStatusIcon
}: ProviderCardProps) {
  const renderCardField = (fieldName: string) => {
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
        placeholder: "https://example.com/webhook"
      }
    };

    const config = fieldConfig[fieldName];
    if (!config) return null;

    const Icon = config.icon;
    const value = isEditing ? (editedFields[fieldName] || "") : (provider[fieldName as keyof ShippingProvider] || "");
    const isApiKey = fieldName === "api_key";
    const requiredFields = getRequiredFields(provider.provider_code);
    const isRequired = requiredFields.includes(fieldName);

    return (
      <div key={fieldName} className="space-y-1">
        <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5 uppercase tracking-wide">
          <Icon size={12} className="text-slate-400" />
          {config.label}
          {isRequired && <span className="text-orange-500 font-bold text-[13px]">*</span>}
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type={isApiKey && !showApiKey ? "password" : "text"}
              value={value}
              onChange={(e) => onFieldChange(fieldName, e.target.value)}
              disabled={!isEditing}
              className={`w-full px-3 py-1.5 rounded-lg border text-sm transition-all duration-150 ${
                isEditing 
                  ? 'bg-white border-slate-300 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 text-slate-700 hover:border-slate-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed'
              }`}
              placeholder={config.placeholder}
            />
            {isApiKey && isEditing && (
              <button
                onClick={onToggleShowApiKey}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                type="button"
              >
                {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            )}
          </div>
          {isEditing && (
            <button
              onClick={() => onCopyToClipboard(value)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 hover:border-slate-300"
              title="Copier"
              type="button"
            >
              <Copy size={15} className="text-slate-500" />
            </button>
          )}
        </div>
        {!isRequired && !isEditing && (
          <p className="text-[10px] text-slate-400">Optionnel</p>
        )}
      </div>
    );
  };

  const fields = getProviderFields(provider.provider_code);
  const providerLabel = getProviderLabel(provider.provider_code);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      {/* Card Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shrink-0">
            <Truck size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-800 text-sm truncate leading-tight">{provider.provider_name}</h3>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-slate-400 font-mono">{provider.provider_code}</p>
              <span className="text-[10px] text-slate-300">•</span>
              <p className="text-[10px] text-slate-400 truncate">{providerLabel}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-medium flex items-center gap-1.5 ${getActiveStatusColor(provider.is_active)}`}>
            {getStatusIcon(provider.is_active)}
            {provider.is_active ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-4 py-3.5 space-y-3.5 flex-1 flex flex-col">
        <div className="space-y-3.5 flex-1">
          {fields.map(fieldName => renderCardField(fieldName))}
        </div>

        {isEditing && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <div className="flex items-center gap-2">
              {editedFields.is_active ? (
                <Power size={13} className="text-green-500" />
              ) : (
                <PowerOff size={13} className="text-slate-400" />
              )}
              <span className="text-xs font-medium text-slate-700">
                {editedFields.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={editedFields.is_active || false}
                onChange={(e) => onFieldChange("is_active", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-200 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} />
            Créé: {new Date(provider.created_at).toLocaleDateString("fr-FR")}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            Mis à jour: {new Date(provider.updated_at).toLocaleDateString("fr-FR")}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          {isEditing ? (
            <>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex-1 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-xs font-medium rounded-lg transition-all duration-150 flex items-center justify-center gap-2 shadow-sm hover:shadow"
              >
                <Save size={14} />
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                onClick={onCancelEditing}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-all duration-150 flex items-center justify-center gap-2"
              >
                <X size={14} />
                Annuler
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onStartEditing}
                className="flex-1 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-all duration-150 flex items-center justify-center gap-2"
              >
                <Edit size={14} />
                Modifier
              </button>
              <button
                onClick={onTestConnection}
                disabled={isTesting}
                className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-medium rounded-lg transition-all duration-150 flex items-center gap-2 border border-orange-200 hover:border-orange-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isTesting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <TestTube size={14} />
                )}
                {isTesting ? "Test..." : "Tester"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}