"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft } from "lucide-react";

export default function InformationsCompte() {
  const router = useRouter();
  const { user, nom, role, loading } = useAuth();
  const [nomModifie, setNomModifie] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/connexion");
  }, [loading, user, router]);

  useEffect(() => {
    if (nom) setNomModifie(nom);
  }, [nom]);

  async function enregistrer() {
    if (!user || !nomModifie.trim()) return;
    setEnvoi(true);
    setSucces(false);
    try {
      await updateDoc(doc(db, "users", user.uid), { nom: nomModifie.trim() });
      setSucces(true);
    } finally {
      setEnvoi(false);
    }
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg text-ink">
        <div className="font-mono text-xs text-muted">Chargement...</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink font-body flex justify-center">
      <div className="w-full max-w-[430px] px-5 pt-6 pb-10">
        <button onClick={() => router.push("/parametres")} className="flex items-center gap-2 text-muted mb-6">
          <ArrowLeft size={18} />
          <span className="font-mono text-xs">Retour</span>
        </button>

        <div className="font-mono text-[11px] tracking-wide text-muted mb-1">COMPTE</div>
        <div className="font-display text-2xl font-bold mb-6">Informations</div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">NOM COMPLET</label>
            <input
              type="text"
              value={nomModifie}
              onChange={(e) => setNomModifie(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-3 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">EMAIL</label>
            <div className="w-full bg-surface border border-border rounded-lg px-3 py-3 text-sm text-muted">
              {user.email}
            </div>
          </div>
          <div>
            <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">RÔLE</label>
            <div className="w-full bg-surface border border-border rounded-lg px-3 py-3 text-sm text-gold font-mono">
              {role?.toUpperCase()}
            </div>
          </div>

          <button
            onClick={enregistrer}
            disabled={envoi}
            className="mt-2 bg-gold text-black rounded-xl py-3 font-semibold text-sm disabled:opacity-50"
          >
            {envoi ? "Enregistrement..." : "Enregistrer"}
          </button>
          {succes && <p className="text-positive text-xs font-mono text-center">Enregistré ✓</p>}
        </div>
      </div>
    </div>
  );
}
