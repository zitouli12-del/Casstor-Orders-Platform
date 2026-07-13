"use client";

import {
  Search,
  RefreshCw,
} from "lucide-react";

import StatusFilter from "./filters/StatusFilter";
import ProviderFilter from "./filters/ProviderFilter";
import DateFilter from "./filters/DateFilter";

interface TrackingFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;

  status: string;
  onStatusChange: (value: string) => void;

  provider: string;
  onProviderChange: (value: string) => void;

  date: string;
  onDateChange: (value: string) => void;

  syncing: boolean;
  onSync: () => void;
}

export default function TrackingFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  provider,
  onProviderChange,
  date,
  onDateChange,
  syncing,
  onSync,
}: TrackingFiltersProps) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un client, téléphone ou tracking..."
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-orange-400"
          />
        </div>

        <StatusFilter
          value={status}
          onChange={onStatusChange}
        />

        <ProviderFilter
          value={provider}
          onChange={onProviderChange}
        />

        <DateFilter
          value={date}
          onChange={onDateChange}
        />

        <button
          onClick={onSync}
          disabled={syncing}
          className="ml-auto flex h-11 min-w-[170px] items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              syncing ? "animate-spin" : ""
            }`}
          />

          {syncing
            ? "Synchronisation..."
            : "Synchroniser"}
        </button>
      </div>
    </div>
  );
}