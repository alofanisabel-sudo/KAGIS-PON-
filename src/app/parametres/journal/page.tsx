"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, deleteDoc, doc, onSnapshot, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, FileClock, Trash2 } from "lucide-react";

interface LogEntry {
  id: string;
  action: string;
  cible: string;
  auteurNom: string;
  date: any;
}

function fmtDate(d: any) {
  if (!d) return "";
  const date = d?.toDate ? d.toDate() : new Date(d);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function getMillis(d: any): number {
  if (!d) return 0;
  if (d?.toDate) return d.toDate().getTime();
  return new Date(d).getTime();
}

const LABELS: Record<string, string> = {
  ajout_revenu: "Ajout — Revenu",
  ajout_depense: "Ajout — Dépense",
  ajout_produit: "Ajout — Produit",
  ajout_reunion: "Ajout — Réunion",
  vente: "Vente enregistrée",
  suppression_transaction: "Suppression — Finance",
  suppression_produit: "Suppression — Stock",
  suppression_vente: "Suppression — Vente",
  suppression_reunion: "Suppression — Réunion",
};

const COULEURS: Record<string, string> = {
  ajout_revenu: "#6FA287",
  ajout_depense: "#B5533C",
  ajout_produit: "#C9A227",
  ajout_reunion: "#C9A227",
  vente: "#6FA287",
  suppression_transaction: "#B5533C",
  suppression_produit: "#B5533C",
  suppression_vente: "#B5533C",
  suppression_reunion: "#B5533C",
};

export default function Journal() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [erreur, setErreur] = useState("");
  const [suppressionId, setSuppressionId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/connexion");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || role !== "admin") return;
    const q = query(collection(db, "logs"), limit(200));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LogEntry));
        entries.sort((a, b) => getMillis(b.date) - getMillis(a.date));
        setLogs(entries);
      },
      (err) => {
        setErreur(`${err.code} — ${err.message}`);
      }
    );
    return () => unsub();
  }, [user, role]);

  async function confirmerSuppression(id: string) {
    await deleteDoc(doc(db, "logs", id));
    setSuppressionId(null);
  }

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

        {erreur && (
          <div className="border border-negative/40 bg-negative/10 rounded-xl p-3 mb-4 font-mono text-[11px] text-negative break-words">
            {erreur}
          </div>
        )}

        {logs.length === 0 && !erreur ? (
          <div className="border border-dashed border-border rounded-2xl py-6 text-center font-mono text-[11px] text-dim">
            Aucune activité enregistrée pour l&apos;instant
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.map((l) => {
              const couleur = COULEURS[l.action] || "#8B8B92";
              return (
                <div key={l.id} className="bg-surface border border-border rounded-2xl px-3.5 py-3 flex items-start gap-3">
                  <div
                    className="w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${couleur}14`, color: couleur }}
                  >
                    <FileClock size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-mono tracking-wide" style={{ color: couleur }}>
                      {LABELS[l.action] || l.action}
                    </div>
                    <div className="text-[13px] font-medium mt-1">{l.cible}</div>
                    <div className="font-mono text-[10px] text-muted mt-1.5">
                      {l.auteurNom} · {fmtDate(l.date)}
                    </div>
                  </div>
                  <button
                    onClick={() => setSuppressionId(l.id)}
                    className="flex-shrink-0 text-dim mt-0.5"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {suppressionId && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-20 px-6"
            onClick={() => setSuppressionId(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[350px] bg-surface border border-border rounded-2xl p-5"
            >
              <div className="font-display text-base font-bold mb-2">Supprimer cette ligne ?</div>
              <p className="font-mono text-[11px] text-muted mb-4">
                Cette action est irréversible et efface définitivement cette trace du journal.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSuppressionId(null)}
                  className="flex-1 border border-border rounded-xl py-2.5 text-sm text-muted"
                >
                  Annuler
                </button>
                <button
                  onClick={() => confirmerSuppression(suppressionId)}
                  className="flex-1 bg-negative text-white rounded-xl py-2.5 text-sm font-semibold"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
