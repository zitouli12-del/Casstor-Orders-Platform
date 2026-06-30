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
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out flex flex-col justify-between shadow-sm
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
          <Logo />

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <X size={18} />
          </button>
        </div>

        <Navigation />
      </div>

      <div className="border-t border-slate-200 p-4 text-center text-xs text-slate-500">
        Casttor Orders © 2026
      </div>
    </aside>
  );
}