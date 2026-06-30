import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 py-10 md:flex-row">

        {/* Logo */}

        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500 text-xl font-bold text-slate-950">
            C
          </div>

          <div>

            <h2 className="text-lg font-bold">
              CASSTOR
            </h2>

            <p className="-mt-1 text-sm text-cyan-400">
              ORDERS
            </p>

          </div>

        </div>

        {/* Links */}

        <div className="flex items-center gap-8 text-sm text-slate-400">

          <Link
            href="/login"
            className="transition hover:text-cyan-400"
          >
            Se connecter
          </Link>

          <Link
            href="/signup"
            className="transition hover:text-cyan-400"
          >
            Créer un compte
          </Link>

        </div>

      </div>

      <div className="border-t border-slate-800">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-slate-500 md:flex-row">

          <p>
            © {new Date().getFullYear()} Casstor Orders.
            Tous droits réservés.
          </p>

          <p>
            Version 1.0
          </p>

        </div>

      </div>

    </footer>
  );
}