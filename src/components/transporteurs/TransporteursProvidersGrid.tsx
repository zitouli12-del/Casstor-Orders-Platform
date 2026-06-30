import { Truck } from "lucide-react";
import ProviderCard from "./ProviderCard";

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

interface TransporteursProvidersGridProps {
  providers: ShippingProvider[];
  editingId: string | null;
  editedFields: { [key: string]: any };
  isSaving: { [key: string]: boolean };
  isTesting: { [key: string]: boolean };
  showApiKeys: { [key: string]: boolean };
  onStartEditing: (provider: ShippingProvider) => void;
  onCancelEditing: () => void;
  onFieldChange: (field: string, value: any) => void;
  onSave: (providerId: string) => void;
  onTestConnection: (providerId: string) => void;
  onToggleShowApiKey: (providerId: string) => void;
  onCopyToClipboard: (text: string) => void;
  getProviderFields: (providerCode: string) => string[];
  getProviderLabel: (providerCode: string) => string;
  getRequiredFields: (providerCode: string) => string[];
  getActiveStatusColor: (isActive: boolean) => string;
  getStatusIcon: (isActive: boolean) => React.ReactNode;
}

export default function TransporteursProvidersGrid({
  providers,
  editingId,
  editedFields,
  isSaving,
  isTesting,
  showApiKeys,
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
  getStatusIcon,
}: TransporteursProvidersGridProps) {
  if (providers.length === 0) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Truck size={28} />
          </div>

          <h3 className="text-lg font-semibold text-slate-700">
            Aucun transporteur
          </h3>

          <p className="text-sm text-slate-500 max-w-md">
            Aucun transporteur n'a été trouvé. Cliquez sur le bouton
            "Ajouter un transporteur" pour commencer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      {providers.map((provider) => (
        <div
          key={provider.id}
          className="w-full sm:w-[420px]"
        >
          <ProviderCard
            provider={provider}
            isEditing={editingId === provider.id}
            editedFields={editedFields}
            isSaving={isSaving[provider.id] || false}
            isTesting={isTesting[provider.id] || false}
            showApiKey={showApiKeys[provider.id] || false}
            onStartEditing={() => onStartEditing(provider)}
            onCancelEditing={onCancelEditing}
            onFieldChange={onFieldChange}
            onSave={() => onSave(provider.id)}
            onTestConnection={() => onTestConnection(provider.id)}
            onToggleShowApiKey={() => onToggleShowApiKey(provider.id)}
            onCopyToClipboard={onCopyToClipboard}
            getProviderFields={getProviderFields}
            getProviderLabel={getProviderLabel}
            getRequiredFields={getRequiredFields}
            getActiveStatusColor={getActiveStatusColor}
            getStatusIcon={getStatusIcon}
          />
        </div>
      ))}
    </div>
  );
}