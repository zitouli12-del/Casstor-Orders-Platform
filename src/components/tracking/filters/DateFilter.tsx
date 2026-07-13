"use client";

import {
  Calendar,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

interface DateFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export default function DateFilter({
  value,
  onChange,
}: DateFilterProps) {
  return (
    <Select
      value={value}
      onValueChange={onChange}
    >
      <SelectTrigger className="h-11 w-[180px] rounded-xl">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <SelectValue placeholder="Date" />
        </div>
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="all">
          Toutes les dates
        </SelectItem>

        <SelectItem value="today">
          Aujourd'hui
        </SelectItem>

        <SelectItem value="yesterday">
          Hier
        </SelectItem>

        <SelectItem value="week">
          Cette semaine
        </SelectItem>

        <SelectItem value="month">
          Ce mois
        </SelectItem>
      </SelectContent>
    </Select>
  );
}