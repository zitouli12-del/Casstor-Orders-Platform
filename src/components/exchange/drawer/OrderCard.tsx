"use client";

import { Package } from "lucide-react";

import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

import { ExchangeFormData } from "@/src/types/ExchangeForm";

interface OrderCardProps {
  form: ExchangeFormData;

  onChange: (
    field: keyof ExchangeFormData,
    value: string | number
  ) => void;
}

export default function OrderCard({
  form,
  onChange,
}: OrderCardProps) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8">
      <div className="mb-8 flex items-center gap-3">
        <Package
          size={20}
          className="text-orange-500"
        />

        <h3 className="text-lg font-semibold uppercase tracking-wider text-gray-700">
          Commande
        </h3>
      </div>

      <div className="space-y-5">
        <div>
          <Label>Produit</Label>

          <Input
            className="mt-2"
            value={form.product}
            onChange={(e) =>
              onChange(
                "product",
                e.target.value
              )
            }
          />
        </div>

        <div>
          <Label>Couleur</Label>

          <Input
            className="mt-2"
            value={form.color}
            onChange={(e) =>
              onChange(
                "color",
                e.target.value
              )
            }
          />
        </div>

        <div>
          <Label>Taille</Label>

          <Input
            className="mt-2"
            value={form.size}
            onChange={(e) =>
              onChange(
                "size",
                e.target.value
              )
            }
          />
        </div>

        <div>
          <Label>Prix</Label>

          <Input
            type="number"
            className="mt-2"
            value={form.price}
            onChange={(e) =>
              onChange(
                "price",
                Number(e.target.value)
              )
            }
          />
        </div>
      </div>
    </div>
  );
}