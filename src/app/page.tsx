"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const router = useRouter();
  const { user, role, nom, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/connexion");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg text-ink">
        <div className="font-mono text-xs text-muted">Chargement...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg text-ink">
      <div className="text-center">
        <div className="font-mono text-xs tracking-widest text-gold mb-2">KGS</div>
        <h1 className="font-display text-3xl font-bold">P-O-N</h1>
        <p className="font-mono text-xs text-muted mt-3">
          Connecté en tant que {nom ?? user.email} · {role?.toUpperCase()}
        </p>
        <button
          onClick={() => signOut(auth)}
          className="mt-6 border border-border text-muted rounded-lg px-4 py-2 text-xs font-mono"
        >
          Se déconnecter
        </button>
      </div>
    </main>
  );
      }
