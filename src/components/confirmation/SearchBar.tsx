import { Search } from "lucide-react";
import { Input } from "@/src/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors"
        size={18}
        strokeWidth={2}
        aria-hidden="true"
      />

      <Input
        type="text"
        placeholder="Rechercher par nom, téléphone, ville, adresse, couleur ou taille..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-11 pr-4 py-2.5 text-sm bg-white rounded-2xl border-slate-200 shadow-sm placeholder:text-slate-400 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 transition-colors"
        aria-label="Rechercher des commandes"
        autoComplete="off"
      />
    </div>
  );
}