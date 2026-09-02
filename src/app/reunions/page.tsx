"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  updateDoc,
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
import { Plus, X, Calendar, ChevronRight, Trash2 } from "lucide-react";

interface Reunion {
  id: string;
  titre: string;
  date: any;
  statut: "a_venir" | "terminee";
  participants: string[];
  compteRendu: string | null;
  auteurNom: string;
}

function fmtDate(d: any) {
  const date = d?.toDate ? d.toDate() : new Date(d);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function Reunions() {
  const router = useRouter();
  const { user, nom, role, loading } = useAuth();
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Reunion | null>(null);
  const [compteRenduTexte, setCompteRenduTexte] = useState("");
  const [suppressionId, setSuppressionId] = useState<string | null>(null);

  const [titre, setTitre] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [participants, setParticipants] = useState("");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/connexion");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "meetings"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setReunions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reunion)));
    });
    return () => unsub();
  }, [user]);

  const aVenir = reunions.filter((r) => r.statut === "a_venir");
  const terminees = reunions.filter((r) => r.statut === "terminee");

  function ouvrirModal() {
    setTitre("");
    setDateStr("");
    setParticipants("");
    setModalOpen(true);
  }

  async function planifier() {
    if (!titre || !dateStr || !user) return;
    setEnvoi(true);
    try {
      await addDoc(collection(db, "meetings"), {
        titre: titre.trim(),
        date: new Date(dateStr),
        statut: "a_venir",
        participants: participants
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
        compteRendu: null,
        auteurId: user.uid,
        auteurNom: nom || user.email,
        dateCreation: serverTimestamp(),
      });

      await addDoc(collection(db, "logs"), {
        action: "ajout_reunion",
        cible: `Réunion "${titre.trim()}" planifiée pour le ${dateStr}`,
        auteurId: user.uid,
        auteurNom: nom || user.email,
        date: serverTimestamp(),
      });

      setModalOpen(false);
    } finally {
      setEnvoi(false);
    }
  }

  function ouvrirDetail(r: Reunion) {
    setSelected(r);
    setCompteRenduTexte(r.compteRendu || "");
  }

  async function sauvegarderCompteRendu() {
    if (!selected) return;
    await updateDoc(doc(db, "meetings", selected.id), {
      compteRendu: compteRenduTexte.trim(),
      statut: "terminee",
    });
    setSelected(null);
  }

  async function confirmerSuppression(id: string) {
    const r = reunions.find((re) => re.id === id);
    await deleteDoc(doc(db, "meetings", id));

    if (r && user) {
      await addDoc(collection(db, "logs"), {
        action: "suppression_reunion",
        cible: `Réunion "${r.titre}" (${fmtDate(r.date)})`,
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
        <div className="px-5 pt-6 pb-2 flex justify-between items-start">
          <div>
            <div className="font-mono text-[11px] tracking-wide text-muted mb-1">RÉUNIONS</div>
            <div className="font-display text-2xl font-bold">Agenda</div>
          </div>
          <button
            onClick={ouvrirModal}
            className="flex items-center gap-1.5 bg-gold/10 border border-gold/40 text-gold rounded-xl px-3.5 py-2.5 text-sm font-semibold"
          >
            <Plus size={15} /> Réunion
          </button>
        </div>

        <div className="px-5 pt-5">
          <div className="font-mono text-[11px] tracking-wide text-muted mb-2.5">À VENIR</div>
          {aVenir.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl py-5 text-center font-mono text-[11px] text-dim">
              Aucune réunion planifiée
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {aVenir.map((r) => (
                <MeetingRow
                  key={r.id}
                  r={r}
                  onClick={() => ouvrirDetail(r)}
                  onDelete={role === "admin" ? () => setSuppressionId(r.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-5 pt-6">
          <div className="font-mono text-[11px] tracking-wide text-muted mb-2.5">TERMINÉES</div>
          {terminees.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl py-5 text-center font-mono text-[11px] text-dim">
              Aucune réunion terminée
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {terminees.map((r) => (
                <MeetingRow
                  key={r.id}
                  r={r}
                  onClick={() => ouvrirDetail(r)}
                  onDelete={role === "admin" ? () => setSuppressionId(r.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div
            className="fixed inset-0 bg-black/70 flex items-end justify-center z-10"
            onClick={() => setSelected(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[430px] bg-surface border-t border-border rounded-t-[20px] p-5 max-h-[75vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-3.5">
                <div>
                  <div className="font-display text-[17px] font-bold">{selected.titre}</div>
                  <div className="font-mono text-[11px] text-muted mt-1">
                    {fmtDate(selected.date)} · {selected.participants.join(", ")}
                  </div>
                </div>
                <X size={18} color="#8B8B92" className="cursor-pointer flex-shrink-0" onClick={() => setSelected(null)} />
              </div>

              <div className="font-mono text-[10px] text-muted tracking-wide mb-1.5">COMPTE-RENDU</div>
              <textarea
                value={compteRenduTexte}
                onChange={(e) => setCompteRenduTexte(e.target.value)}
                placeholder="Notez ici les décisions prises et les points à retenir."
                rows={6}
                className="w-full bg-black border border-border rounded-lg p-3 text-sm outline-none focus:border-gold resize-none leading-relaxed"
              />
              <button
                onClick={sauvegarderCompteRendu}
                className="w-full mt-3 bg-gold text-black rounded-xl py-3 font-semibold text-sm"
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}

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
                <div className="font-display text-[17px] font-bold">Planifier une réunion</div>
                <X size={18} color="#8B8B92" className="cursor-pointer" onClick={() => setModalOpen(false)} />
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">TITRE</label>
                  <input
                    type="text"
                    value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                    placeholder="ex: Point mensuel équipe"
                    className="w-full bg-black border border-border rounded-lg px-3 py-3 text-sm outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">DATE</label>
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full bg-black border border-border rounded-lg px-3 py-3 text-sm outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-muted tracking-wide block mb-1.5">
                    PARTICIPANTS (séparés par virgule)
                  </label>
                  <input
                    type="text"
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    placeholder="ex: Sieg, Awa"
                    className="w-full bg-black border border-border rounded-lg px-3 py-3 text-sm outline-none focus:border-gold"
                  />
                </div>

                <button
                  onClick={planifier}
                  disabled={envoi || !titre || !dateStr}
                  className="mt-2 bg-gold text-black rounded-xl py-3 font-semibold text-sm disabled:opacity-50"
                >
                  {envoi ? "Planification..." : "Planifier"}
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
              <div className="font-display text-base font-bold mb-2">Supprimer cette réunion ?</div>
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

function MeetingRow({
  r,
  onClick,
  onDelete,
}: {
  r: Reunion;
  onClick: () => void;
  onDelete?: () => void;
}) {
  const enAttente = r.statut === "a_venir";
  return (
    <div className="bg-surface border border-border rounded-2xl px-3.5 py-3 flex items-center gap-3">
      <div onClick={onClick} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
        <div
          className="w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: enAttente ? "#C9A22714" : "#2A2A2E",
            color: enAttente ? "#C9A227" : "#8B8B92",
          }}
        >
          <Calendar size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold truncate">{r.titre}</div>
          <div className="font-mono text-[10px] text-muted mt-0.5">
            {fmtDate(r.date)} · {r.participants.join(", ")}
          </div>
        </div>
      </div>
      {onDelete && (
        <button onClick={onDelete} className="flex-shrink-0 text-dim" aria-label="Supprimer">
          <Trash2 size={15} />
        </button>
      )}
      <ChevronRight size={16} color="#3A3A3E" className="flex-shrink-0" onClick={onClick} />
    </div>
  );
}
