"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import BottomNav from "@/components/BottomNav";
import { Plus, TrendingUp, TrendingDown, X, Trash2 } from "lucide-react";

interface Transaction {
  id: string;
  type: "revenu" | "depense";
  montant: number;
  categorie: string;
  date: any;
  description: string;
  auteurNom: string;
  source: string;
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

export default function Finance() {
  const router = useRouter();
  const { user, nom, role, loading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"revenu" | "depense">("revenu");
  const [suppressionId, setSuppressionId] = useState<string | null>(null);

  const [montant, setMontant] = useState("");
  const [categorie, setCategorie] = useState("");
  const [description, setDescription] = useState("");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/connexion");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction)));
    });
    return () => unsub();
  }, [user]);

  const revenus = transactions.filter((t) => t.type === "revenu").reduce((s, t) => s + t.montant, 0);
  const depenses = transactions.filter((t) => t.type === "depense").reduce((s, t) => s + t.montant, 0);
  const solde = revenus - depenses;

  function ouvrirModal(type: "revenu" | "depense") {
    setModalType(type);
    setMontant("");
    setCategorie("");
    setDescription("");
    setModalOpen(true);
  }

  async function enregistrer() {
    if (!montant || !categorie || !user) return;
    setEnvoi(true);
    try {
      const categorieFormatee = categorie.trim().charAt(0).toUpperCase() + categorie.trim().slice(1).toLowerCase();

      await addDoc(collection(db, "transactions"), {
        type: modalType,
        montant: Number(montant),
        categorie: categorieFormatee,
        description: description.trim(),
        date: serverTimestamp(),
        auteurId: user.uid,
        auteurNom: nom || user.email,
        source: "manuelle",
      });

      await addDoc(collection(db, "logs"), {
        action: modalType === "revenu" ? "ajout_revenu" : "ajout_depense",
        cible: `${modalType === "revenu" ? "Revenu" : "Dépense"} de ${Number(montant).toLocaleString("fr-FR")} FCFA (${categorieFormatee})`,
        auteurId: user.uid,
        auteurNom: nom || user.email,
        date: serverTimestamp(),
      });

      setModalOpen(false);
    } finally {
      setEnvoi(false);
    }
  }

  async function confirmerSuppression(id: string) {
    const t = transactions.find((tr) => tr.id === id);
    await deleteDoc(doc(db, "transactions", id));

    if (t && user) {
      await addDoc(collection(db, "logs"), {
        action: "suppression_transaction",
        cible: `${t.type === "revenu" ? "Revenu" : "Dépense"} de ${t.montant.toLocaleString("fr-FR")} FCFA (${t.categorie})`,
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
      <div className="w-full max-w-[430px] relative pb-24">
        <div className="px-5 pt-6 pb-2">
          <div className="font-mono text-[11px] tracking-wide text-muted mb-1">FINANCE</div>
          <div className="font-display text-2xl font-bold">Opérations</div>
        </div>

        <div className="mx-5 mt-4 bg-surface border border-border rounded-2xl p-4 flex justify-between items-center">
          <div>
            <div className="font-mono text-[10px] text-muted tracking-wide">SOLDE CALCULÉ</div>
            <div className="font-display text-2xl font-bold mt-0.5">{fmt(solde)}</div>
          </div>
          <div className="text-right font-mono text-[11px]">
            <div className="text-positive">+{fmt(revenus)}</div>
            <div className="text-negative mt-0.5">−{fmt(depenses)}</div>
          </div>
        </div>

        <div className="flex gap-2.5 px-5 pt-4">
          <button
            onClick={() => ouvrirModal("revenu")}
            className="flex-1 flex items-center justify-center gap-1.5 bg-positive/10 border border-positive/40 text-positive rounded-xl py-3 text-sm font-semibold"
          >
            <Plus size={15} /> Revenu
          </button>
          <button
            onClick={() => ouvrirModal("depense")}
            className="flex-1 flex items-center justify-center gap-1.5 bg-negative/10 border border-negative/40 text-negative rounded-xl py-3 text-sm font-semibold"
          >
            <Plus size={15} /> Dépense
          </button>
        </div>

        <div className="px-5 pt-6">
          <div className="font-mono text-[11px] tracking-wide text-muted mb-2.5">HISTORIQUE</div>
          {transactions.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl py-6 text-center font-mono text-[11px] text-dim">
              Aucune opération pour l&apos;instant
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.map((t) => (
                <div key={t.id} className="bg-surface border border-border rounded-2xl px-3.5 py-3 flex items-center gap-3">
                  <div
                    className="rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: t.type === "revenu" ? "#6FA28714" : "#B5533C14",
                      color: t.type === "revenu" ? "#6FA287" : "#B5533C",
                      width: 34,
                      height: 34,
                    }}
                  >
                    {t.type === "revenu" ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">
                      {t.description || t.categorie}
                    </div>
                    <div className="font-mono text-[10px] text-muted mt-0.5">
                      {t.categorie} · {t.auteurNom}
                      {t.source === "vente" && <span className="text-gold"> · vente auto</span>}
                    </div>
                  </div>
                  <div
                    className="font-display text-[13px] font-bold flex-shrink-0"
                    style={{ color: t.type === "revenu" ? "#6FA287" : "#B5533C" }}
                  >
                    {t.type === "revenu" ? "+" : "−"}
                    {t.montant.toLocaleString("fr-FR")}
                  </div>
                  {role === "admin" && (
                    <button
                      onClick={() => setSuppressionId(t.id)}
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
        </div>

        {modalOpen && (
          <div
            className="fixed inset-0 bg-black/70 flex items-end justify-center z-10"
            onClick={() => setModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[430px] bg-surface border-t border-border rounded-t-[20px] p-5"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="font-display text-[17px] font-bold">
                  Ajouter {modalType === "revenu" ? "un revenu" : "une dépense"}
                </div>
                <X size={18} color="#8B8B92" className="cursor-pointer" onClick={() => setModalOpen(false)} />
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">MONTANT (FCFA)</label>
                  <input
                    type="number"
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    placeholder="0"
                    className="w-full bg-black border border-border rounded-lg px-3 py-3 text-sm outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">CATÉGORIE</label>
                  <input
                    type="text"
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value)}
                    placeholder="ex: Loyer, Vente, Transport..."
                    className="w-full bg-black border border-border rounded-lg px-3 py-3 text-sm outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">DESCRIPTION</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Détail de l'opération"
                    className="w-full bg-black border border-border rounded-lg px-3 py-3 text-sm outline-none focus:border-gold"
                  />
                </div>

                <button
                  onClick={enregistrer}
                  disabled={envoi || !montant || !categorie}
                  className="mt-2 rounded-xl py-3 font-semibold text-sm text-black disabled:opacity-50"
                  style={{ background: modalType === "revenu" ? "#6FA287" : "#B5533C" }}
                >
                  {envoi ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
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
              <div className="font-display text-base font-bold mb-2">Supprimer cette opération ?</div>
              <p className="font-mono text-[11px] text-muted mb-4">Cette action est irréversible.</p>
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

        <BottomNav />
      </div>
    </div>
  );
}
