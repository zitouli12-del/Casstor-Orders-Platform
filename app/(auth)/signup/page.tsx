"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSignup = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (error) {
        throw error;
      }

      alert(
        "Compte créé avec succès"
      );

      router.push("/login");

    } catch (error: any) {

      alert(
        error.message ||
        "Erreur inscription"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">

      <form
        onSubmit={handleSignup}
        className="w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold">
          Signup
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
            ? "Création..."
            : "Créer un compte"}
        </button>

      </form>

    </div>
  );
}