"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function AccesRefuse() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg text-ink font-body flex items-center justify-center px-6">
      <div className="text-center max-w-xs">
        <div className="w-14 h-14 rounded-full bg-negative/10 text-negative flex items-center justify-center mx-auto mb-5">
          <ShieldAlert size={26} />
        </div>
        <div className="font-mono text-xs tracking-widest text-gold mb-2">KGS</div>
        <h1 className="font-display text-xl font-bold mb-3">Accès désactivé</h1>
        <p className="font-mono text-xs text-muted leading-relaxed mb-6">
          Votre accès à P-O-N a été désactivé par un administrateur. Contactez-le si vous pensez qu&apos;il
          s&apos;agit d&apos;une erreur.
        </p>
        <button
          onClick={() => router.push("/connexion")}
          className="border border-border text-muted rounded-lg px-4 py-2 text-xs font-mono"
        >
          Retour à la connexion
        </button>
      </div>
    </div>
  );
        }
