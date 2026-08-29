"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";

export default function Inscription() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    if (motDePasse.length < 6) {
      setErreur("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setChargement(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, motDePasse);

      await setDoc(doc(db, "users", cred.user.uid), {
        nom,
        email,
        role: "membre",
        actif: true,
        dateCreation: serverTimestamp(),
        dernierAcces: serverTimestamp(),
      });

      router.push("/");
    } catch (err: any) {
      setErreur(`${err.code || "erreur"} — ${err.message || ""}`);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-5 font-body text-ink">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-mono text-xs tracking-widest text-gold mb-2">KGS</div>
          <h1 className="font-display text-2xl font-bold">Rejoindre P-O-N</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="font-mono text-[10px] tracking-wide text-muted block mb-1.5">NOM COMPLET</label>
            <input
              type="text"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full bg-black border border-border rounded-lg px-3 py-3 text-sm outline-none focus:border-gold"
              placeholder="Votre nom"
            />
          </div>
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
              placeholder="6 caractères minimum"
            />
          </div>

          {erreur && <p className="text-negative text-xs font-mono break-words">{erreur}</p>}

          <button
            type="submit"
            disabled={chargement}
            className="mt-2 bg-gold text-black rounded-xl py-3 font-semibold text-sm disabled:opacity-50"
          >
            {chargement ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="text-center text-muted text-xs font-mono mt-6">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-gold">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
