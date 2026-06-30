"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        throw error;
      }

      router.push("/confirmation");

    } catch (error: any) {

      alert(
        error.message ||
          "Erreur connexion"
      );

    } finally {

      setLoading(false);

    }
  }

return (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl">

<div className="mb-8 text-center">

  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500 text-3xl font-black text-slate-950 shadow-lg shadow-cyan-500/20">
    C
  </div>

  <h1 className="text-3xl font-bold tracking-tight text-white">
    Bienvenue sur
    <br />
    <span className="text-cyan-400">
      Casttor Orders
    </span>
  </h1>

  <p className="mt-3 text-sm text-slate-400">
    Connectez-vous pour accéder à votre tableau de bord.
  </p>

</div>

    <form onSubmit={handleLogin} className="space-y-5">

      <input
        type="email"
        placeholder="Adresse e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
      />

      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-cyan-500 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>

    </form>

  </div>
);
}