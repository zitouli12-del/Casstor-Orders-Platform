"use client";

import { Menu, Bell, LogOut, Search } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="h-10 w-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition"
        >
          <Menu size={20} className="text-slate-700" />
        </button>

        <div className="hidden md:flex items-center gap-2 w-[380px] h-10 rounded-xl border border-slate-200 px-3">
          <Search size={18} className="text-slate-400" />

          <input
            placeholder="Rechercher..."
            className="flex-1 outline-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative h-10 w-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition">
          <Bell size={18} className="text-slate-700" />

          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center">
            3
          </span>
        </button>

        <button
          onClick={handleLogout}
          className="h-10 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition"
        >
          <div className="flex items-center gap-2">
            <LogOut size={16} />
            Logout
          </div>
        </button>
      </div>
    </header>
  );
}