"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CheckSquare, History, Menu, X, Truck, Settings, FileText } from "lucide-react";
import "@/app/globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isActive = (path: string) => pathname === path;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <html lang="fr">
      <body className="bg-[#0f172a] text-slate-100 antialiased min-h-screen font-sans">
        
        <div className="flex min-h-screen relative w-full overflow-x-hidden">
          
          {/* ================= SIDEBAR (DESKTOP & MOBILE) ================= */}
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111827] border-r border-slate-800 transition-transform duration-300 ease-in-out flex flex-col justify-between
              ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            <div>
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-[#0b0f19]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-black text-black shadow-md select-none">
                    C
                  </div>
                  <span className="font-black text-lg tracking-wider text-white">
                    CASTTOR <span className="text-orange-500">ORDERS</span>
                  </span>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="p-4 space-y-1.5 mt-4">
                <Link
                  href="/confirmation"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 group
                    ${
                      isActive("/confirmation")
                        ? "bg-orange-600/10 text-orange-500 border border-orange-500/20"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }
                  `}
                >
                  <CheckSquare
                    size={18}
                    className={isActive("/confirmation") ? "text-orange-500" : "text-slate-400 group-hover:text-slate-200"}
                  />
                  Confirmation
                </Link>

                <Link
                  href="/historique"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 group
                    ${
                      isActive("/historique")
                        ? "bg-blue-600/10 text-blue-500 border border-blue-500/20"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }
                  `}
                >
                  <History
                    size={18}
                    className={isActive("/historique") ? "text-blue-500" : "text-slate-400 group-hover:text-slate-200"}
                  />
                  Historique
                </Link>

                <Link
                  href="/shipping"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 group
                    ${
                      isActive("/shipping")
                        ? "bg-emerald-600/10 text-emerald-500 border border-emerald-500/20"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }
                  `}
                >
                  <Truck
                    size={18}
                    className={isActive("/shipping") ? "text-emerald-500" : "text-slate-400 group-hover:text-slate-200"}
                  />
                  Shipping
                </Link>

                <Link
                  href="/bon-livraisons"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 group
                    ${
                      pathname.startsWith("/bon-livraisons")
                        ? "bg-cyan-600/10 text-cyan-500 border border-cyan-500/20"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }
                  `}
                >
                  <FileText
                    size={18}
                    className={
                      pathname.startsWith("/bon-livraisons")
                        ? "text-cyan-500"
                        : "text-slate-400 group-hover:text-slate-200"
                    }
                  />
                  Bon de Livraison
                </Link>

                <Link
                  href="/parametres"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 group
                    ${
                      isActive("/parametres")
                        ? "bg-purple-600/10 text-purple-500 border border-purple-500/20"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }
                  `}
                >
                  <Settings
                    size={18}
                    className={isActive("/parametres") ? "text-purple-500" : "text-slate-400 group-hover:text-slate-200"}
                  />
                  Paramètres
                </Link>
              </nav>
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#0b0f19]/40 text-xs text-slate-500 text-center font-medium">
              Casttor Orders © 2026
            </div>
          </aside>

          {isSidebarOpen && (
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm transition-opacity duration-300"
            />
          )}

          {/* ================= MAIN CONTENT AREA ================= */}
          <div className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ease-in-out
            ${isSidebarOpen ? "lg:pl-64" : "lg:pl-0"}
          `}>
            
            {/* ================= NAVBAR (TOP) ================= */}
            <header className="h-16 border-b border-slate-800 bg-[#111827]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8">
              
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  <Menu size={20} />
                </button>
                <h2 className="font-semibold text-sm lg:text-base text-slate-200 tracking-wide hidden sm:block">
                  CASTTOR Orders Dashboard
                </h2>
              </div>
            </header>

            {/* ================= BODY CONTENT ================= */}
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
              <div className="max-w-[1600px] mx-auto w-full">
                {children}
              </div>
            </main>

          </div>
        </div>
      </body>
    </html>
  );
}