import {
  Plus,
  X,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Truck,
  User,
  Key,
  Link
} from "lucide-react";

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  isAdding: boolean;
  selectedProviderCode: string;
  onProviderSelect: (code: string) => void;
  newProviderFields: { [key: string]: string };
  onFieldChange: (field: string, value: string) => void;
  showApiKey: boolean;
  onToggleShowApiKey: () => void;
  onCopyToClipboard: (text: string) => void;
  availableProviders: { code: string; name: string }[];
  existingProviders: { provider_code: string }[];
  getProviderFields: (providerCode: string) => string[];
  getRequiredFields: (providerCode: string) => string[];
}

export default function AddProviderModal({
  isOpen,
  onClose,
  onAdd,
  isAdding,
  selectedProviderCode,
  onProviderSelect,
  newProviderFields,
  onFieldChange,
  showApiKey,
  onToggleShowApiKey,
  onCopyToClipboard,
  availableProviders,
  existingProviders,
  getProviderFields,
  getRequiredFields
}: AddProviderModalProps) {
  if (!isOpen) return null;

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
        <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5 mb-1.5">
          <Icon size={14} />
          {config.label}
          {isRequired && <span className="text-orange-500 text-xs">*</span>}
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type={isApiKey && !showApiKey ? "password" : "text"}
              value={value}
              onChange={(e) => onFieldChange(fieldName, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 text-sm transition-colors"
              placeholder={config.placeholder}
            />
            {isApiKey && (
              <button
                onClick={onToggleShowApiKey}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
          <button
            onClick={() => onCopyToClipboard(value)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            title="Copier"
          >
            <Copy size={16} className="text-slate-600" />
          </button>
        </div>
        {!isRequired && (
          <p className="text-xs text-slate-400 mt-1">Optionnel - peut être laissé vide</p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Plus size={20} className="text-orange-500" />
            Ajouter un transporteur
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5 mb-1.5">
              <Truck size={14} />
              Transporteur
            </label>
            <div className="relative">
              <select
                value={selectedProviderCode}
                onChange={(e) => onProviderSelect(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 text-sm appearance-none cursor-pointer transition-colors"
              >
                <option value="">Sélectionner un transporteur</option>
                {availableProviders.map((provider) => {
                  const isExisting = existingProviders.some(
                    p => p.provider_code === provider.code
                  );
                  return (
                    <option 
                      key={provider.code} 
                      value={provider.code}
                      disabled={isExisting}
                      className={isExisting ? "text-slate-400" : "text-slate-700"}
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
            <div className="space-y-4 pt-2 border-t border-slate-200">
              {getProviderFields(selectedProviderCode).map(fieldName => renderModalField(fieldName))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex flex-wrap gap-3 justify-end sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onAdd}
            disabled={!selectedProviderCode || isAdding}
            className={`px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2 ${
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
  );
}