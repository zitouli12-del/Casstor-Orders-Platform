"use client";

import "@/app/globals.css";

import { Geist } from "next/font/google";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";

import DashboardLayout from "@/src/components/layout/DashboardLayout";
import { Toaster } from "@/src/components/ui/sonner";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isPublicPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup";

  return (
    <html lang="fr" className={cn("font-sans", geist.variable)}>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen font-sans">
        {isPublicPage ? (
          children
        ) : (
          <DashboardLayout>{children}</DashboardLayout>
        )}

        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}