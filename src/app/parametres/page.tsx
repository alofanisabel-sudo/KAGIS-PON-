"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, query } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import BottomNav from "@/components/BottomNav";
import { ChevronRight, User, Users, Shield, LogOut, X, Sun, Moon, FileClock } from "lucide-react";

interface Membre {
  id: string;
  nom: string;
  role: string;
  email: string;
}

export default function Parametres() {
  const router = useRouter();
  const { user, nom, role, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [membres, setMembres] = useState<Membre[]>([]);
  const [membresOpen, setMembresOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/connexion");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, "users")), (snap) => {
      setMembres(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Membre)));
    });
    return () => unsub();
  }, [user]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg text-ink">
        <div className="font-mono text-xs text-muted">Chargement...</div>
      </main>
    );
  }

  const initiales = (nom || user.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-bg text-ink font-body flex justify-center">
      <div className="w-full max-w-[430px] relative pb-24">
        <div className="px-5 pt-6 pb-2">
          <div className="font-mono text-[11px] tracking-wide text-muted mb-1">PARAMÈTRES</div>
          <div className="font-display text-2xl font-bold">Réglages</div>
        </div>

        <div className="mx-5 mt-5 bg-surface border border-border rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/40 text-gold flex items-center justify-center font-display text-base font-bold flex-shrink-0">
            {initiales}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold">{nom || user.email}</div>
            <div className="font-mono text-[10px] text-gold mt-0.5 tracking-wide">{role?.toUpperCase()}</div>
          </div>
        </div>

        <SectionLabel text="COMPTE" />
        <SettingsGroup>
          <SettingsRow
            icon={<User size={17} />}
            label="Informations du compte"
            onClick={() => router.push("/parametres/compte")}
          />
          <SettingsRow
            icon={<Users size={17} />}
            label="Membres et accès"
            trailing={<span className="font-mono text-[10px] text-muted">{membres.length}</span>}
            onClick={() => setMembresOpen(true)}
          />
        </SettingsGroup>

        <SectionLabel text="APPARENCE" />
        <div className="mx-5 bg-surface border border-border rounded-2xl p-2 flex gap-2">
          <button
            onClick={() => setTheme("light")}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors"
            style={{
              background: theme === "light" ? "var(--gold)" : "transparent",
              color: theme === "light" ? "#0C0C0E" : "var(--muted)",
            }}
          >
            <Sun size={15} /> Lumière
          </button>
          <button
            onClick={() => setTheme("dark")}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors"
            style={{
              background: theme === "dark" ? "var(--gold)" : "transparent",
              color: theme === "dark" ? "#0C0C0E" : "var(--muted)",
            }}
          >
            <Moon size={15} /> Sombre
          </button>
        </div>

        <SectionLabel text="SÉCURITÉ" />
        <SettingsGroup>
          <SettingsRow icon={<Shield size={17} />} label="Mot de passe" />
          {role === "admin" && (
            <SettingsRow
              icon={<FileClock size={17} />}
              label="Journal d'activité"
              onClick={() => router.push("/parametres/journal")}
            />
          )}
        </SettingsGroup>

        <div className="px-5 pt-5">
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 bg-negative/10 border border-negative/30 text-negative rounded-2xl py-3.5 text-[13px] font-semibold"
          >
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>

        <div className="text-center mt-6 font-mono text-[10px] text-[#3A3A3E] tracking-wide">
          P-O-N · KAGIS · v0.1
        </div>

        {membresOpen && (
          <div
            className="fixed inset-0 bg-black/70 flex items-end justify-center z-10"
            onClick={() => setMembresOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[430px] bg-surface border-t border-border rounded-t-[20px] p-5 max-h-[70vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="font-display text-[17px] font-bold">Membres et accès</div>
                <X size={18} color="#8B8B92" className="cursor-pointer" onClick={() => setMembresOpen(false)} />
              </div>

              <div className="flex flex-col gap-2">
                {membres.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 bg-black border border-border rounded-xl px-3 py-2.5">
                    <div className="w-[34px] h-[34px] rounded-full bg-[#2A2A2E] flex items-center justify-center font-display text-xs font-bold flex-shrink-0">
                      {(m.nom || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold truncate">{m.nom}</div>
                    </div>
                    <span
                      className="font-mono text-[10px] tracking-wide rounded-full px-2.5 py-1 border flex-shrink-0"
                      style={{
                        color: m.role === "admin" ? "#C9A227" : "#8B8B92",
                        borderColor: m.role === "admin" ? "#C9A22755" : "#2A2A2E",
                      }}
                    >
                      {m.role?.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <div className="font-mono text-[10px] tracking-wide text-dim px-5 pt-5 pb-2">{text}</div>;
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <div className="mx-5 bg-surface border border-border rounded-2xl overflow-hidden">{children}</div>;
}

function SettingsRow({
  icon,
  label,
  trailing,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-3.5 py-3.5 border-b border-border last:border-b-0"
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="text-muted">{icon}</div>
      <div className="flex-1 text-[13px] font-medium">{label}</div>
      {trailing}
      <ChevronRight size={16} color="#3A3A3E" />
    </div>
  );
    }
