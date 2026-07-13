"use client";

import { X } from "lucide-react";

import Logo from "./Logo";
import Navigation from "./Navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <aside
      aria-label="Navigation principale"
      className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[85vw] max-w-[290px] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out lg:w-72 lg:max-w-none lg:shadow-sm ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 sm:px-5 lg:px-6">
          <div className="min-w-0">
            <Logo />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <Navigation />
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 text-center text-[11px] text-slate-400">
        Casttor Orders © 2026
      </div>
    </aside>
  );
}