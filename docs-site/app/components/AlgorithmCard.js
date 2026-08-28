"use client";

import { useTheme } from "./ThemeContext";

export default function AlgorithmCard({ title, description, steps, index }) {
  const { isGlass } = useTheme();

  return (
    <div className={`rounded-xl p-5 my-4 ${
      isGlass
        ? "bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
        : "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
          isGlass
            ? "bg-purple-500/30 text-purple-200"
            : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
        }`}>
          {index + 1}
        </span>
        <h3 className={`text-base font-semibold ${isGlass ? "text-white" : "text-gray-900 dark:text-white"}`}>
          {title}
        </h3>
      </div>
      {description && (
        <p className={`text-sm mb-3 ${isGlass ? "text-gray-300" : "text-gray-600 dark:text-gray-400"}`}>
          {description}
        </p>
      )}
      <ol className="space-y-1.5">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className={`font-mono text-xs mt-0.5 shrink-0 ${
              isGlass ? "text-gray-400" : "text-gray-500 dark:text-gray-500"
            }`}>
              [{i + 1}]
            </span>
            <span className={isGlass ? "text-gray-200" : "text-gray-700 dark:text-gray-300"}>
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
