import { Search } from "lucide-react";

interface TransporteursSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TransporteursSearchBar({ value, onChange }: TransporteursSearchBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher par nom, code ou client ID..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition-all duration-200"
        />
      </div>
    </div>
  );
}