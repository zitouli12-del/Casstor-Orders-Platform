import Link from "next/link";

export default function AuthBrand() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-12">

      {/* Glow */}

      <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />

      {/* Logo */}

      <div className="relative z-10">

        <Link
          href="/"
          className="flex items-center gap-4"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500 text-2xl font-black text-slate-950">
            C
          </div>

          <div>

            <h1 className="text-2xl font-black tracking-wider text-white">
              CASTTOR
            </h1>

            <p className="-mt-1 text-cyan-400 font-semibold">
              ORDERS
            </p>

          </div>

        </Link>

      </div>

      {/* Center */}

      <div className="relative z-10 max-w-xl">

        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-400">
          Plateforme E-commerce
        </span>

        <h2 className="mt-8 text-5xl font-extrabold leading-tight text-white">

          Gérez toutes vos commandes

          <span className="text-cyan-400">
            {" "}depuis une seule plateforme.
          </span>

        </h2>

        <p className="mt-8 text-lg leading-8 text-slate-400">

          Casstor Orders centralise vos commandes,
          automatise votre workflow,
          facilite vos expéditions
          et vous fait gagner du temps.

        </p>

      </div>

      {/* Features */}

      <div className="relative z-10 grid gap-5">

        <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">

          <div className="text-2xl">
            🚀
          </div>

          <div>

            <h3 className="font-semibold text-white">
              Workflow Automatisé
            </h3>

            <p className="text-sm text-slate-400">
              De la commande jusqu'à la livraison.
            </p>

          </div>

        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">

          <div className="text-2xl">
            🔐
          </div>

          <div>

            <h3 className="font-semibold text-white">
              API Sécurisée
            </h3>

            <p className="text-sm text-slate-400">
              Chaque boutique possède sa propre API.
            </p>

          </div>

        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">

          <div className="text-2xl">
            📦
          </div>

          <div>

            <h3 className="font-semibold text-white">
              Multi Stores
            </h3>

            <p className="text-sm text-slate-400">
              Gérez plusieurs boutiques facilement.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}