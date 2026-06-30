"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">

      {/* Background Glow */}

      <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[140px]" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center">

        {/* Badge */}

        <div className="mb-8 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-5 py-2 text-sm font-medium text-cyan-400">
          Plateforme de Gestion des Commandes
        </div>

        {/* Title */}

        <h1 className="max-w-5xl text-5xl font-extrabold leading-tight md:text-7xl">

          Gérez toutes vos commandes

          <br />

          depuis

          <span className="text-cyan-400">
            {" "}une seule plateforme.
          </span>

        </h1>

        {/* Description */}

        <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-300">

          Recevez automatiquement les commandes de vos Landing Pages
          grâce à votre API Casstor Orders, confirmez-les,
          expédiez-les vers vos transporteurs
          et gérez tout votre workflow depuis une seule interface.

        </p>

        {/* Buttons */}

        <div className="mt-12 flex flex-col gap-5 sm:flex-row">

          <Link
            href="/signup"
            className="rounded-xl bg-cyan-500 px-8 py-4 text-lg font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Créer un compte
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-slate-700 px-8 py-4 text-lg transition hover:border-cyan-400 hover:text-cyan-400"
          >
            Se connecter
          </Link>

        </div>

        {/* Stats */}

        <div className="mt-20 grid w-full max-w-5xl gap-6 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">

            <div className="mb-3 text-4xl">
              🔐
            </div>

            <h3 className="text-xl font-semibold">
              API Sécurisée
            </h3>

            <p className="mt-3 text-slate-400">
              Chaque boutique possède sa propre clé API sécurisée.
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">

            <div className="mb-3 text-4xl">
              ⚡
            </div>

            <h3 className="text-xl font-semibold">
              Rapide & Fiable
            </h3>

            <p className="mt-3 text-slate-400">
              Les commandes arrivent instantanément dans votre tableau de bord.
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">

            <div className="mb-3 text-4xl">
              🚚
            </div>

            <h3 className="text-xl font-semibold">
              Expédition Simplifiée
            </h3>

            <p className="mt-3 text-slate-400">
              Envoyez vos colis vers vos transporteurs en quelques clics.
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}