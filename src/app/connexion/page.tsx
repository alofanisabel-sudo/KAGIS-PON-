"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";

export default function Connexion() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await signInWithEmailAndPassword(auth, email, motDePasse);
      router.push("/");
    } catch (err) {
      setErreur("Email ou mot de passe incorrect.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-5 font-body text-ink">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-mono text-xs tracking-widest text-gold mb-2">KGS</div>
          <h1 className="font-display text-2xl font-bold">Connexion à P-O-N</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="font-mono text-[10px] tracking-wide text-muted block mb-1.5">EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-border rounded-lg px-3 py-3 text-sm outline-none focus:border-gold"
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] tracking-wide text-muted block mb-1.5">MOT DE PASSE</label>
            <input
              type="password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full bg-black border border-border rounded-lg px-3 py-3 text-sm outline-none focus:border-gold"
              placeholder="••••••••"
            />
          </div>

          {erreur && <p className="text-negative text-xs font-mono">{erreur}</p>}

          <button
            type="submit"
            disabled={chargement}
            className="mt-2 bg-gold text-black rounded-xl py-3 font-semibold text-sm disabled:opacity-50"
          >
            {chargement ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-muted text-xs font-mono mt-6">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-gold">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
    }
