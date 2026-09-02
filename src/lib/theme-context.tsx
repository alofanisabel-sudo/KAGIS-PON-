"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type ThemeChoice = "light" | "dark";

interface ThemeContextType {
  theme: ThemeChoice;
  setTheme: (t: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
});

function applyTheme(t: ThemeChoice) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(t);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("pon-theme") as ThemeChoice) || "dark";
    setThemeState(saved);
    applyTheme(saved);
  }, []);

  function setTheme(t: ThemeChoice) {
    setThemeState(t);
    localStorage.setItem("pon-theme", t);
    applyTheme(t);
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
  }
