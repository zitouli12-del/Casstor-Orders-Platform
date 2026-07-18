"use client";

import { User } from "lucide-react";

import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

import { ExchangeFormData } from "./ExchangeDrawer";

interface ClientCardProps {
  form: ExchangeFormData;

  onChange: (
    field: keyof ExchangeFormData,
    value: string | number
  ) => void;
}

export default function ClientCard({
  form,
  onChange,
}: ClientCardProps) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8">
      <div className="mb-8 flex items-center gap-3">
        <User
          size={20}
          className="text-orange-500"
        />

        <h3 className="text-lg font-semibold uppercase tracking-wider text-gray-700">
          Client
        </h3>
      </div>

      <div className="space-y-5">
        <div>
          <Label>Nom</Label>

          <Input
            className="mt-2"
            value={form.receiver}
            onChange={(e) =>
              onChange(
                "receiver",
                e.target.value
              )
            }
          />
        </div>

        <div>
          <Label>Téléphone</Label>

          <Input
            className="mt-2"
            value={form.phone}
            onChange={(e) =>
              onChange(
                "phone",
                e.target.value
              )
            }
          />
        </div>

        <div>
          <Label>Ville</Label>

          <Input
            className="mt-2"
            value={form.city}
            onChange={(e) =>
              onChange(
                "city",
                e.target.value
              )
            }
          />
        </div>

        <div>
          <Label>Adresse</Label>

          <Input
            className="mt-2"
            value={form.address}
            onChange={(e) =>
              onChange(
                "address",
                e.target.value
              )
            }
          />
        </div>
      </div>
    </div>
  );
}