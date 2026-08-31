"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import BottomNav from "@/components/BottomNav";
import { Plus, Minus, AlertTriangle, X, Trash2, ShoppingCart, History } from "lucide-react";

interface Produit {
  id: string;
  nom: string;
  prix: number;
  quantite: number;
  seuilAlerte: number;
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

export default function Stock() {
  const router = useRouter();
  const { user, nom, role, loading } = useAuth();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [suppressionId, setSuppressionId] = useState<string | null>(null);
  const [venteProduit, setVenteProduit] = useState<Produit | null>(null);
  const [venteQuantite, setVenteQuantite] = useState("1");
  const [venteEnvoi, setVenteEnvoi] = useState(false);

  const [nomP, setNomP] = useState("");
  const [prix, setPrix] = useState("");
  const [quantite, setQuantite] = useState("");
  const [seuil, setSeuil] = useState("");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/connexion");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "products"), orderBy("nom", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setProduits(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Produit)));
    });
    return () => unsub();
  }, [user]);

  const enAlerte = produits.filter((p) => p.quantite <= p.seuilAlerte);

  async function ajuster(id: string, delta: number, quantiteActuelle: number) {
    if (quantiteActuelle + delta < 0) return;
    await updateDoc(doc(db, "products", id), {
      quantite: increment(delta),
      derniereMaj: serverTimestamp(),
    });
  }

  function ouvrirModal() {
    setNomP("");
    setPrix("");
    setQuantite("");
    setSeuil("");
    setModalOpen(true);
  }

  async function enregistrer() {
    if (!nomP || !prix || !user) return;
    setEnvoi(true);
    try {
      await addDoc(collection(db, "products"), {
        nom: nomP.trim(),
        prix: Number(prix),
        quantite: Number(quantite) || 0,
        seuilAlerte: Number(seuil) || 5,
        dateCreation: serverTimestamp(),
        derniereMaj: serverTimestamp(),
      });
      setModalOpen(false);
    } finally {
      setEnvoi(false);
    }
  }

  async function confirmerSuppression(id: string) {
    await deleteDoc(doc(db, "products", id));
    setSuppressionId(null);
  }

  function ouvrirVente(p: Produit) {
    setVenteProduit(p);
    setVenteQuantite("1");
  }

  async function confirmerVente() {
    if (!venteProduit || !user) return;
    const qte = Number(venteQuantite);
    if (!qte || qte <= 0 || qte > venteProduit.quantite) return;

    setVenteEnvoi(true);
    try {
      const montantTotal = qte * venteProduit.prix;
      const batch = writeBatch(db);

      const produitRef = doc(db, "products", venteProduit.id);
      batch.update(produitRef, {
        quantite: increment(-qte),
        derniereMaj: serverTimestamp(),
      });

      const venteRef = doc(collection(db, "sales"));
      batch.set(venteRef, {
        produitId: venteProduit.id,
        produitNom: venteProduit.nom,
        quantiteVendue: qte,
        prixUnitaire: venteProduit.prix,
        montantTotal,
        date: serverTimestamp(),
        auteurId: user.uid,
        auteurNom: nom || user.email,
      });

      const transactionRef = doc(collection(db, "transactions"));
      batch.set(transactionRef, {
        type: "revenu",
        montant: montantTotal,
        categorie: "Vente",
        description: `${qte}x ${venteProduit.nom}`,
        date: serverTimestamp(),
        auteurId: user.uid,
        auteurNom: nom || user.email,
        source: "vente",
        venteId: venteRef.id,
      });

      await batch.commit();
      setVenteProduit(null);
    } finally {
      setVenteEnvoi(false);
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
      <div className="w-full max-w-[430px] relative pb-24">
        <div className="px-5 pt-6 pb-2 flex justify-between items-start">
          <div>
            <div className="font-mono text-[11px] tracking-wide text-muted mb-1">STOCK</div>
            <div className="font-display text-2xl font-bold">Produits</div>
          </div>
          <button
            onClick={ouvrirModal}
            className="flex items-center gap-1.5 bg-gold/10 border border-gold/40 text-gold rounded-xl px-3.5 py-2.5 text-sm font-semibold"
          >
            <Plus size={15} /> Produit
          </button>
        </div>

        <div className="px-5 pt-3">
          <button
            onClick={() => router.push("/stock/historique")}
            className="flex items-center gap-1.5 text-muted font-mono text-xs"
          >
            <History size={14} /> Historique des ventes
          </button>
        </div>

        {enAlerte.length > 0 && (
          <div className="mx-5 mt-4 bg-negative/10 border border-negative/30 rounded-2xl px-3.5 py-3 flex items-center gap-2.5">
            <AlertTriangle size={16} color="#B5533C" className="flex-shrink-0" />
            <div className="text-xs">
              <strong className="text-negative">{enAlerte.length} produit{enAlerte.length > 1 ? "s" : ""}</strong> en
              stock faible ou épuisé
            </div>
          </div>
        )}

        <div className="px-5 pt-5">
          <div className="font-mono text-[11px] tracking-wide text-muted mb-2.5">TOUS LES PRODUITS</div>
          {produits.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl py-6 text-center font-mono text-[11px] text-dim">
              Aucun produit pour l&apos;instant
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {produits.map((p) => {
                const alerte = p.quantite <= p.seuilAlerte;
                const epuise = p.quantite === 0;
                return (
                  <div
                    key={p.id}
                    className="bg-surface rounded-2xl px-3.5 py-3 flex flex-col gap-2.5"
                    style={{ border: `1px solid ${epuise ? "#B5533C55" : "#2A2A2E"}` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate">{p.nom}</div>
                        <div className="font-mono text-[10px] text-muted mt-0.5">{fmt(p.prix)}</div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => ajuster(p.id, -1, p.quantite)}
                          className="w-[26px] h-[26px] rounded-full bg-black border border-border text-muted flex items-center justify-center"
                        >
                          <Minus size={12} />
                        </button>
                        <div
                          className="font-display text-[15px] font-bold w-6 text-center"
                          style={{ color: epuise ? "#B5533C" : alerte ? "#C9A227" : "#F2F1EC" }}
                        >
                          {p.quantite}
                        </div>
                        <button
                          onClick={() => ajuster(p.id, 1, p.quantite)}
                          className="w-[26px] h-[26px] rounded-full bg-black border border-border text-muted flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {role === "admin" && (
                        <button
                          onClick={() => setSuppressionId(p.id)}
                          className="flex-shrink-0 text-dim ml-1"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => ouvrirVente(p)}
                      disabled={p.quantite === 0}
                      className="w-full flex items-center justify-center gap-1.5 bg-positive/10 border border-positive/30 text-positive rounded-lg py-2 text-xs font-semibold disabled:opacity-30"
                    >
                      <ShoppingCart size={13} /> Vendre
                    </button>
                  </div>
                );
              })}
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
                <div className="font-display text-[17px] font-bold">Ajouter un produit</div>
                <X size={18} color="#8B8B92" className="cursor-pointer" onClick={() => setModalOpen(false)} />
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">NOM DU PRODUIT</label>
                  <input
                    type="text"
                    value={nomP}
                    onChange={(e) => setNomP(e.target.value)}
                    placeholder="ex: GENESIS White"
                    className="w-full bg-black border border-border rounded-lg px-3 py-3 text-sm outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">PRIX (FCFA)</label>
                  <input
                    type="number"
                    value={prix}
                    onChange={(e) => setPrix(e.target.value)}
                    placeholder="0"
                    className="w-full bg-black border border-border rounded-lg px-3 py-3 text-sm outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">QUANTITÉ INITIALE</label>
                  <input
                    type="number"
                    value={quantite}
                    onChange={(e) => setQuantite(e.target.value)}
                    placeholder="0"
                    className="w-full bg-black border border-border rounded-lg px-3 py-3 text-sm outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">SEUIL D&apos;ALERTE</label>
                  <input
                    type="number"
                    value={seuil}
                    onChange={(e) => setSeuil(e.target.value)}
                    placeholder="ex: 10"
                    className="w-full bg-black border border-border rounded-lg px-3 py-3 text-sm outline-none focus:border-gold"
                  />
                </div>

                <button
                  onClick={enregistrer}
                  disabled={envoi || !nomP || !prix}
                  className="mt-2 bg-gold text-black rounded-xl py-3 font-semibold text-sm disabled:opacity-50"
                >
                  {envoi ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </div>
          </div>
        )}

        {venteProduit && (
          <div
            className="fixed inset-0 bg-black/70 flex items-end justify-center z-10"
            onClick={() => setVenteProduit(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[430px] bg-surface border-t border-border rounded-t-[20px] p-5"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="font-display text-[17px] font-bold">Vendre {venteProduit.nom}</div>
                <X size={18} color="#8B8B92" className="cursor-pointer" onClick={() => setVenteProduit(null)} />
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
                    QUANTITÉ VENDUE (disponible : {venteProduit.quantite})
                  </label>
                  <input
                    type="number"
                    value={venteQuantite}
                    onChange={(e) => setVenteQuantite(e.target.value)}
                    min={1}
                    max={venteProduit.quantite}
                    className="w-full bg-black border border-border rounded-lg px-3 py-3 text-sm outline-none focus:border-gold"
                  />
                </div>

                <div className="bg-black border border-border rounded-lg px-3 py-3 flex justify-between items-center">
                  <span className="font-mono text-[10px] text-muted tracking-wide">TOTAL</span>
                  <span className="font-display text-base font-bold text-positive">
                    {fmt((Number(venteQuantite) || 0) * venteProduit.prix)}
                  </span>
                </div>

                <button
                  onClick={confirmerVente}
                  disabled={
                    venteEnvoi ||
                    !venteQuantite ||
                    Number(venteQuantite) <= 0 ||
                    Number(venteQuantite) > venteProduit.quantite
                  }
                  className="mt-1 bg-positive text-black rounded-xl py-3 font-semibold text-sm disabled:opacity-50"
                >
                  {venteEnvoi ? "Enregistrement..." : "Confirmer la vente"}
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
              <div className="font-display text-base font-bold mb-2">Supprimer ce produit ?</div>
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
