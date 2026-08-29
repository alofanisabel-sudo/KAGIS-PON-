"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import BottomNav from "@/components/BottomNav";
import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, ShoppingBag } from "lucide-react";

interface Transaction {
  id: string;
  type: "revenu" | "depense";
  montant: number;
  date: any;
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nbVentes, setNbVentes] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push("/connexion");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, "transactions")), (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction)));
    });
    const unsubVentes = onSnapshot(query(collection(db, "sales")), (snap) => {
      setNbVentes(snap.size);
    });
    return () => {
      unsub();
      unsubVentes();
    };
  }, [user]);

  const { revenus, depenses, solde, evolution, statut, statutColor, curseurPos } = useMemo(() => {
    const revenus = transactions.filter((t) => t.type === "revenu").reduce((s, t) => s + t.montant, 0);
    const depenses = transactions.filter((t) => t.type === "depense").reduce((s, t) => s + t.montant, 0);
    const solde = revenus - depenses;

    // Regroupement par mois pour le graphique
    const parMois: Record<string, { revenus: number; depenses: number }> = {};
    transactions.forEach((t) => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      const cle = d.toLocaleDateString("fr-FR", { month: "short" });
      if (!parMois[cle]) parMois[cle] = { revenus: 0, depenses: 0 };
      parMois[cle][t.type === "revenu" ? "revenus" : "depenses"] += t.montant;
    });
    const evolution = Object.entries(parMois).map(([mois, v]) => ({ mois, ...v }));

    const ratio = revenus > 0 ? (revenus - depenses) / revenus : 0;
    let statut = "ÉQUILIBRE";
    let statutColor = "#8B8B92";
    let curseurPos = 50;
    if (ratio > 0.05) {
      statut = "BÉNÉFICE";
      statutColor = "#6FA287";
      curseurPos = 50 + Math.min(ratio * 100, 45);
    } else if (ratio < -0.05) {
      statut = "PERTE";
      statutColor = "#B5533C";
      curseurPos = 50 + Math.max(ratio * 100, -45);
    }

    return { revenus, depenses, solde, evolution, statut, statutColor, curseurPos };
  }, [transactions]);

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
        <div className="px-5 pt-6 pb-2 flex items-center justify-between">
          <div>
            <div className="font-mono text-xs tracking-widest text-gold mb-1">KGS</div>
            <div className="font-display text-2xl font-bold">P-O-N</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center font-mono text-xs text-muted">
            {(user.email || "?")[0].toUpperCase()}
          </div>
        </div>

        <div className="px-5 pt-5 pb-2">
          <div className="font-mono text-[11px] tracking-wide text-muted mb-1.5">SOLDE ACTUEL</div>
          <div className="font-display text-4xl font-bold tracking-tight">{fmt(solde)}</div>

          <div className="mt-5">
            <div
              className="relative h-1.5 rounded-full"
              style={{ background: "linear-gradient(90deg, #B5533C 0%, #2A2A2E 45%, #2A2A2E 55%, #6FA287 100%)" }}
            >
              <div
                className="absolute -top-1 w-4 h-4 rounded-full border-2"
                style={{
                  left: `${curseurPos}%`,
                  transform: "translateX(-50%)",
                  background: statutColor,
                  borderColor: "#0C0C0E",
                  boxShadow: `0 0 0 1px ${statutColor}`,
                }}
              />
            </div>
            <div className="flex justify-between items-center mt-2.5">
              <span className="font-mono text-[10px] text-dim tracking-wide">PERTE</span>
              <span
                className="font-display text-xs font-bold tracking-wide px-3 py-1 rounded-full border"
                style={{ color: statutColor, borderColor: `${statutColor}55`, background: `${statutColor}14` }}
              >
                ● {statut}
              </span>
              <span className="font-mono text-[10px] text-dim tracking-wide">BÉNÉFICE</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 px-5 pt-5">
          <StatCard icon={<TrendingUp size={16} />} label="Revenus" value={fmt(revenus)} color="#6FA287" />
          <StatCard icon={<TrendingDown size={16} />} label="Dépenses" value={fmt(depenses)} color="#B5533C" />
          <StatCard icon={<ShoppingBag size={16} />} label="Ventes" value={String(nbVentes)} color="#C9A227" />
        </div>

        <div className="px-5 pt-6">
          <div className="font-mono text-[11px] tracking-wide text-muted mb-2.5">ÉVOLUTION</div>
          <div className="bg-surface border border-border rounded-2xl p-3 h-44">
            {evolution.length === 0 ? (
              <div className="h-full flex items-center justify-center font-mono text-[11px] text-dim">
                Aucune donnée pour l&apos;instant
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolution}>
                  <XAxis dataKey="mois" tick={{ fill: "#5A5A60", fontSize: 11 }} axisLine={{ stroke: "#2A2A2E" }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0C0C0E", border: "1px solid #2A2A2E", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => v.toLocaleString("fr-FR") + " FCFA"}
                  />
                  <Line type="monotone" dataKey="revenus" stroke="#6FA287" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="depenses" stroke="#B5533C" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex-1 bg-surface border border-border rounded-2xl p-3">
      <div style={{ color }} className="mb-2">
        {icon}
      </div>
      <div className="font-mono text-[10px] text-muted">{label}</div>
      <div className="font-display text-sm font-bold mt-1 break-words">{value}</div>
    </div>
  );
}
