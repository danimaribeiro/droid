"use client";

import { useEffect } from "react";
import { useTheme } from "./ThemeContext";

export default function ThemeSwitcher() {
  const { theme, setTheme, isGlass } = useTheme();

  useEffect(() => {
    import("preline/preline").then(() => {
      window.HSStaticMethods?.autoInit();
    });
  }, [theme]);

  return (
    <div className="hs-dropdown relative inline-flex">
      <button
        id="hs-dropdown-theme"
        type="button"
        className={`hs-dropdown-toggle py-1.5 px-3 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border shadow-sm ${isGlass ? "border-white/[0.15] bg-white/[0.08] text-white hover:bg-white/[0.12]" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
        aria-haspopup="menu"
        aria-expanded="false"
        aria-label="Theme"
      >
        {theme === "light" ? "☀️ Light" : theme === "dark" ? "🌙 Dark" : theme === "glass" ? "✦ Glass" : "💻 System"}
        <svg className="hs-dropdown-open:rotate-180 size-3.5" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 4 4 4-4"/></svg>
      </button>
      <div
        className={`hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden min-w-40 shadow-md rounded-lg p-1 mt-2 z-50 border ${isGlass ? "bg-gray-900 border-white/[0.08]" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="hs-dropdown-theme"
      >
        {[
          { id: "light", label: "☀️ Light" },
          { id: "dark", label: "🌙 Dark" },
          { id: "system", label: "💻 System" },
          { id: "glass", label: "✦ Glass" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`flex items-center gap-x-2 w-full py-2 px-3 rounded-lg text-sm ${theme === t.id ? (isGlass ? "bg-white/[0.1] text-blue-400" : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400") : (isGlass ? "text-gray-100 hover:bg-white/[0.06]" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700")}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
