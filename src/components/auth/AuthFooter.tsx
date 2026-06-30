import Link from "next/link";

export default function AuthFooter() {
  return (
    <div className="mt-8 text-center text-sm text-slate-400">
      <p>
        Pas encore de compte ?{" "}
        <Link
          href="/signup"
          className="text-cyan-400 hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}