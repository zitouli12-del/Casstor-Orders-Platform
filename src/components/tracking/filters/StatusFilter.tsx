"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

import { STATUS_OPTIONS } from "./options";

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export default function StatusFilter({
  value,
  onChange,
}: StatusFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-11 w-[220px] rounded-xl">
        <SelectValue placeholder="Tous les statuts" />
      </SelectTrigger>

      <SelectContent>
        {STATUS_OPTIONS.map((status) => (
          <SelectItem
            key={status.value}
            value={status.value}
          >
            {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}