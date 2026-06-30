import { Input } from "@/src/components/ui/input";
import { Search } from "lucide-react";

interface HistoriqueSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function HistoriqueSearchBar({ value, onChange }: HistoriqueSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <Input
        type="text"
        placeholder="Rechercher par nom, téléphone ou ville..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-11 pr-4 py-3 rounded-2xl border-slate-200 bg-white shadow-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:ring-slate-200 transition-all"
      />
    </div>
  );
}