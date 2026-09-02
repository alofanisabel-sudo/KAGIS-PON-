"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, ShoppingBag, Trash2 } from "lucide-react";

interface Vente {
  id: string;
  produitNom: string;
  quantiteVendue: number;
  prixUnitaire: number;
  montantTotal: number;
  date: any;
  auteurNom: string;
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function fmtDate(d: any) {
  const date = d?.toDate ? d.toDate() : new Date(d);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function HistoriqueVentes() {
  const router = useRouter();
  const { user, nom, role, loading } = useAuth();
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [suppressionId, setSuppressionId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/connexion");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "sales"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setVentes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vente)));
    });
    return () => unsub();
  }, [user]);

  async function confirmerSuppression(id: string) {
    const v = ventes.find((ve) => ve.id === id);
    await deleteDoc(doc(db, "sales", id));

    if (v && user) {
      await addDoc(collection(db, "logs"), {
        action: "suppression_vente",
        cible: `Vente de ${v.quantiteVendue}x "${v.produitNom}" (${fmt(v.montantTotal)})`,
        auteurId: user.uid,
        auteurNom: nom || user.email,
        date: serverTimestamp(),
      });
    }

    setSuppressionId(null);
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
        <button onClick={() => router.push("/stock")} className="flex items-center gap-2 text-muted mb-6">
          <ArrowLeft size={18} />
          <span className="font-mono text-xs">Retour</span>
        </button>

        <div className="font-mono text-[11px] tracking-wide text-muted mb-1">STOCK</div>
        <div className="font-display text-2xl font-bold mb-6">Historique des ventes</div>

        {ventes.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl py-6 text-center font-mono text-[11px] text-dim">
            Aucune vente pour l&apos;instant
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {ventes.map((v) => (
              <div key={v.id} className="bg-surface border border-border rounded-2xl px-3.5 py-3 flex items-center gap-3">
                <div className="w-[34px] h-[34px] rounded-full bg-gold/10 text-gold flex items-center justify-center flex-shrink-0">
                  <ShoppingBag size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">
                    {v.quantiteVendue}x {v.produitNom}
                  </div>
                  <div className="font-mono text-[10px] text-muted mt-0.5">
                    {fmtDate(v.date)} · {v.auteurNom}
                  </div>
                </div>
                <div className="font-display text-[13px] font-bold text-positive flex-shrink-0">
                  {fmt(v.montantTotal)}
                </div>
                {role === "admin" && (
                  <button
                    onClick={() => setSuppressionId(v.id)}
                    className="flex-shrink-0 text-dim"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
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
              <div className="font-display text-base font-bold mb-2">Supprimer cette vente ?</div>
              <p className="font-mono text-[11px] text-muted mb-4">
                Cette action est irréversible. La transaction financière liée ne sera pas supprimée automatiquement.
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
