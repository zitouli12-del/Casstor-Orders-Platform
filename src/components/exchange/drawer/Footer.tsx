"use client";

import { Loader2, RefreshCcw } from "lucide-react";

import { Button } from "@/src/components/ui/button";

interface FooterProps {
  loading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function Footer({
  loading,
  onCancel,
  onSubmit,
}: FooterProps) {
  return (
    <div className="flex items-center justify-end gap-4 border-t border-slate-200 bg-white px-8 py-6">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={loading}
      >
        Annuler
      </Button>

      <Button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Création...
          </>
        ) : (
          <>
            <RefreshCcw className="h-4 w-4" />
            Créer l'échange
          </>
        )}
      </Button>
    </div>
  );
}