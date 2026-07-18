"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Shipment } from "@/src/types/Shipment";
import { ExchangeFormData } from "@/src/types/ExchangeForm";

import { createExchange } from "@/src/services/exchange/createExchange";

import DrawerHeader from "./DrawerHeader";
import ClientCard from "./ClientCard";
import OrderCard from "./OrderCard";
import NoteCard from "./NoteCard";
import Footer from "./Footer";

interface ExchangeDrawerProps {
  open: boolean;
  shipment: Shipment | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExchangeDrawer({
  open,
  shipment,
  onClose,
  onSuccess,
}: ExchangeDrawerProps) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] =
    useState<ExchangeFormData>({
      receiver: "",
      phone: "",
      city: "",
      address: "",

      product: "",
      color: "",
      size: "",

      price: 0,

      note: "",
    });

  useEffect(() => {
    if (!shipment) return;

    setForm({
      receiver:
        shipment.customer_name ?? "",

      phone:
        shipment.customer_phone ?? "",

      city:
        shipment.customer_city ?? "",

      address:
        shipment.customer_address ?? "",

      product:
        shipment.parcel_product ?? "",

      color:
        shipment.parcel_color ?? "",

      size:
        shipment.parcel_size ?? "",

      price:
        shipment.parcel_price ?? 0,

      note: "",
    });
  }, [shipment]);

  function updateForm(
    field: keyof ExchangeFormData,
    value: string | number
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit() {
    if (!shipment) return;

    try {
      setLoading(true);

      await createExchange(
        shipment.id,
        form
      );

      toast.success(
        "Échange créée avec succès."
      );

      onSuccess();

      onClose();
    } catch (error) {
      console.error(
        "CREATE EXCHANGE FAILED =",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open || !shipment) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      />

      {/* Drawer */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
        <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl">
          <DrawerHeader
            shipment={shipment}
            onClose={onClose}
          />

          <div className="flex-1 overflow-y-auto px-8 py-7">
            <div className="space-y-7">
              <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
                <ClientCard
                  form={form}
                  onChange={updateForm}
                />

                <OrderCard
                  form={form}
                  onChange={updateForm}
                />
              </div>

              <NoteCard
                value={form.note}
                onChange={(value) =>
                  updateForm("note", value)
                }
              />
            </div>
          </div>

          <Footer
            loading={loading}
            onCancel={onClose}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </>
  );
}