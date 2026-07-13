"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CheckSquare,
  FileText,
  History,
  MapPinned,
  Settings,
  Truck,
} from "lucide-react";

const links = [
  {
    title: "Confirmation",
    href: "/confirmation",
    icon: CheckSquare,
  },
  {
    title: "Historique",
    href: "/historique",
    icon: History,
  },
  {
    title: "Suivi des Expéditions",
    href: "/suivi-expeditions",
    icon: MapPinned,
  },
  {
    title: "Transporteurs",
    href: "/transporteurs",
    icon: Truck,
  },
  {
    title: "Bon de Livraison",
    href: "/bon-livraisons",
    icon: FileText,
  },
  {
    title: "Paramètres",
    href: "/parametres",
    icon: Settings,
  },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="mt-3 space-y-1.5 px-3 py-2 sm:px-4">
      {links.map((link) => {
        const Icon = link.icon;

        const active =
          pathname === link.href ||
          pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              active
                ? "border border-orange-200 bg-orange-50 text-orange-600 shadow-sm"
                : "border border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Icon
              size={18}
              strokeWidth={1.8}
              className="shrink-0"
            />

            <span className="min-w-0 truncate">
              {link.title}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}