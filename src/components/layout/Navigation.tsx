"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  History,
  Truck,
  Settings,
  FileText,
} from "lucide-react";

const links = [
  {
    title: "Confirmation",
    href: "/confirmation",
    icon: CheckSquare,
    color: "orange",
  },
  {
    title: "Historique",
    href: "/historique",
    icon: History,
    color: "blue",
  },
  {
    title: "Transporteurs",
    href: "/transporteurs",
    icon: Truck,
    color: "emerald",
  },
  {
    title: "Bon de Livraison",
    href: "/bon-livraisons",
    icon: FileText,
    color: "cyan",
  },
  {
    title: "Paramètres",
    href: "/parametres",
    icon: Settings,
    color: "purple",
  },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="p-4 space-y-1.5 mt-4">
      {links.map((link) => {
        const Icon = link.icon;

        const active =
          link.href === "/bon-livraisons"
            ? pathname.startsWith("/bon-livraisons")
            : pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all
              ${
                active
                  ? "bg-orange-600/10 text-orange-500 border border-orange-500/20"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
          >
            <Icon size={18} />
            {link.title}
          </Link>
        );
      })}
    </nav>
  );
}