"use client";

import { useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import GlassShell from "@/app/components/GlassShell";
import ThemeSwitcher from "@/app/components/ThemeSwitcher";
import { useTheme } from "@/app/components/ThemeContext";
import Link from "next/link";
import { Bot, Menu } from "lucide-react";

export default function StagesLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isGlass } = useTheme();

  const border = isGlass ? "border-white/[0.10]" : "border-gray-200 dark:border-gray-700";

  return (
    <GlassShell className="flex h-screen overflow-hidden">
      {/* Sidebar — fixed, full viewport height */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Top bar — sticky */}
        <header className={`shrink-0 flex items-center justify-between px-4 py-2.5 border-b ${border} ${
          isGlass
            ? "bg-white/[0.08] backdrop-blur-xl"
            : "bg-white dark:bg-gray-900"
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`lg:hidden p-1.5 rounded-lg ${
                isGlass
                  ? "text-gray-300 hover:bg-white/[0.08]"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" className={`flex items-center gap-1.5 text-sm font-bold ${
              isGlass ? "text-white" : "text-gray-800 dark:text-gray-200"
            } transition-colors`}>
              <Bot className="w-5 h-5" />
              droid
            </Link>
          </div>
          <ThemeSwitcher />
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </GlassShell>
  );
}
