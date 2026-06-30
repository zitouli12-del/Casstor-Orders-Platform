"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        {/* Logo */}

        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500 text-2xl font-bold text-slate-950">
            C
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-wide">
              CASSTOR
            </h1>

            <p className="-mt-1 text-sm text-cyan-400">
              ORDERS
            </p>
          </div>
        </Link>

        {/* Right */}

        <div className="flex items-center gap-4">

          <Link
            href="/login"
            className="rounded-xl border border-slate-700 px-5 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-400"
          >
            Se connecter
          </Link>

        </div>

      </div>
    </header>
  );
}