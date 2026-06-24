"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      const { data: sessionData } =
        await supabase.auth.getSession();

      console.log(
        "SESSION AFTER LOGIN =",
        sessionData
      );

      console.log(
        "USER AFTER LOGIN =",
        sessionData.session?.user
      );

      if (error) {
        throw error;
      }

      window.location.href = "/dashboard";
      return;

    } catch (error: any) {

      alert(
        error.message ||
        "Erreur connexion"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">

      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold">
          Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          className="w-full border p-3"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          className="w-full border p-3"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white p-3"
        >
          {loading
            ? "Connexion..."
            : "Se connecter"}
        </button>

      </form>

    </div>
  );
}