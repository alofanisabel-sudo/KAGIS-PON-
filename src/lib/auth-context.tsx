"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "./firebase";

type Role = "admin" | "membre" | null;

interface AuthContextType {
  user: User | null;
  role: Role;
  nom: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  nom: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [nom, setNom] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setRole(null);
        setNom(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), async (snap) => {
      const data = snap.data();

      if (data && data.actif === false) {
        await signOut(auth);
        router.push("/acces-refuse");
        return;
      }

      setRole((data?.role as Role) ?? "membre");
      setNom((data?.nom as string) ?? null);
      setLoading(false);
    });
    return () => unsubscribeDoc();
  }, [user, router]);

  return (
    <AuthContext.Provider value={{ user, role, nom, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
  }
