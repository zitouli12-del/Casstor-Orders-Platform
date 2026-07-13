"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

import { PROVIDER_OPTIONS } from "./options";

interface ProviderFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ProviderFilter({
  value,
  onChange,
}: ProviderFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-11 w-[230px] rounded-xl">
        <SelectValue placeholder="Tous les transporteurs" />
      </SelectTrigger>

      <SelectContent>
        {PROVIDER_OPTIONS.map((provider) => (
          <SelectItem
            key={provider.value}
            value={provider.value}
          >
            {provider.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}