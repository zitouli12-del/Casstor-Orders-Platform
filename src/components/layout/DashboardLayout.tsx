"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          isSidebarOpen ? "lg:pl-72" : ""
        }`}
      >
        <Topbar
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />

<main className="flex-1 bg-slate-50 p-8">
  <div className="w-full px-2">
    {children}
  </div>
</main>
      </div>
    </div>
  );
}