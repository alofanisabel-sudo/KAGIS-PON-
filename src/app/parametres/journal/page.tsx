"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, FileClock } from "lucide-react";

interface LogEntry {
  id: string;
  action: string;
  cible: string;
  auteurNom: string;
  date: any;
}

function fmtDate(d: any) {
  const date = d?.toDate ? d.toDate() : new Date(d);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const LABELS: Record<string, string> = {
  suppression_transaction: "Suppression — Finance",
  suppression_produit: "Suppression — Stock",
  suppression_vente: "Suppression — Vente",
  suppression_reunion: "Suppression — Réunion",
};

export default function Journal() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/connexion");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || role !== "admin") return;
    const q = query(collection(db, "logs"), orderBy("date", "desc"), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as LogEntry)));
    });
    return () => unsub();
  }, [user, role]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg text-ink">
        <div className="font-mono text-xs text-muted">Chargement...</div>
      </main>
    );
  }

  if (role !== "admin") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg text-ink px-6">
        <div className="text-center font-mono text-xs text-muted">
          Cette section est réservée aux administrateurs.
        </div>
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

        <div className="font-mono text-[11px] tracking-wide text-muted mb-1">SÉCURITÉ</div>
        <div className="font-display text-2xl font-bold mb-6">Journal d&apos;activité</div>

        {logs.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl py-6 text-center font-mono text-[11px] text-dim">
            Aucune suppression enregistrée pour l&apos;instant
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.map((l) => (
              <div key={l.id} className="bg-surface border border-border rounded-2xl px-3.5 py-3 flex items-start gap-3">
                <div className="w-[34px] h-[34px] rounded-full bg-negative/10 text-negative flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileClock size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-mono text-gold tracking-wide">
                    {LABELS[l.action] || l.action}
                  </div>
                  <div className="text-[13px] font-medium mt-1">{l.cible}</div>
                  <div className="font-mono text-[10px] text-muted mt-1.5">
                    {l.auteurNom} · {fmtDate(l.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
                                           }
