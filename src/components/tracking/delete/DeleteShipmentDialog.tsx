"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";

import { Button } from "@/src/components/ui/button";

import { Shipment } from "@/src/types/Shipment";

import { deleteShipment } from "@/src/services/tracking/deleteShipment";

interface DeleteShipmentDialogProps {
  open: boolean;
  shipment: Shipment | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteShipmentDialog({
  open,
  shipment,
  onClose,
  onSuccess,
}: DeleteShipmentDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!shipment) return null;

  async function handleDelete() {
    try {
      setLoading(true);

      await deleteShipment(shipment!.id);

      toast.success("Expédition supprimée avec succès.");

      onSuccess();
      onClose();
    } catch (error) {
      console.error("DELETE SHIPMENT FAILED =", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !loading) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md rounded-3xl border-0 p-0 overflow-hidden">
        <div className="p-6">
          <DialogHeader className="items-start">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
              <Trash2 className="h-7 w-7 text-red-600" />
            </div>

            <DialogTitle className="text-2xl font-bold text-slate-900">
              Supprimer l'expédition
            </DialogTitle>

            <DialogDescription className="pt-2 text-sm text-slate-500">
              Êtes-vous sûr de vouloir supprimer cette expédition ?
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Client
                </p>

                <p className="mt-1 text-base font-semibold text-slate-900">
                  {shipment.customer_name || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Tracking
                </p>

                <p className="mt-1 break-all font-mono text-sm text-slate-700">
                  {shipment.tracking_number || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <p className="text-sm leading-6 text-red-700">
              Cette action est irréversible.
              <br />
              Cette expédition sera supprimée définitivement.
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Suppression..." : "Supprimer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}