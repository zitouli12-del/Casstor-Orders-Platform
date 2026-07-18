import {
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { BlacklistEntry } from "@/src/services/blacklist/getBlacklistEntryByPhone";

interface BlacklistCardProps {
  blacklistEntry: BlacklistEntry | null;
  checkingBlacklist: boolean;
  onAddToBlacklist: () => void;
}

export default function BlacklistCard({
  blacklistEntry,
  checkingBlacklist,
  onAddToBlacklist,
}: BlacklistCardProps) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6">
      <div className="mb-5 flex items-center gap-3">
        <ShieldAlert
          size={18}
          className="text-red-600"
        />

        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
          Blacklist
        </h3>
      </div>

      {checkingBlacklist ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Vérification...
        </div>
      ) : blacklistEntry ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <ShieldCheck
              size={18}
              className="text-red-600"
            />

            <span className="font-semibold text-red-700">
              Client blacklisté
            </span>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Raison
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {blacklistEntry.reason}
            </p>
          </div>

          {blacklistEntry.notes && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Notes
              </p>

              <p className="mt-1 text-sm text-gray-700">
                {blacklistEntry.notes}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Ce client n'est pas dans votre blacklist.
          </p>

          <Button
            className="w-full"
            variant="destructive"
            onClick={onAddToBlacklist}
          >
            Ajouter à la blacklist
          </Button>
        </div>
      )}
    </div>
  );
}