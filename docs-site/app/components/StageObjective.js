"use client";

import { useTheme } from "./ThemeContext";

export default function StageObjective({ objective }) {
  const { isGlass } = useTheme();

  return (
    <div className={`rounded-xl p-5 my-6 ${
      isGlass
        ? "bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
        : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40"
    }`}>
      <div className={`text-xs font-bold tracking-wider uppercase mb-2 ${
        isGlass ? "text-blue-300" : "text-blue-600 dark:text-blue-400"
      }`}>
        Stage Objective
      </div>
      <p className={`text-sm leading-relaxed ${
        isGlass ? "text-gray-200" : "text-gray-700 dark:text-gray-300"
      }`}>
        {objective}
      </p>
    </div>
  );
}
