import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">

      <div className="w-full max-w-md">

        {children}

      </div>

    </div>
  );
}