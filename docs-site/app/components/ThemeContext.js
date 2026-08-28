"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const THEME_KEY = "droid_theme";
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("glass");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored && ["light", "dark", "system", "glass"].includes(stored)) {
      setThemeState(stored);
    }
  }, []);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
  }, []);

  const isGlass = theme === "glass";
  const isDark =
    theme === "dark" ||
    isGlass ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isGlass, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
