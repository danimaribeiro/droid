"use client";

import { useTheme } from "./ThemeContext";

export default function GlassShell({ children, className = "" }) {
  const { isGlass, isDark } = useTheme();

  if (isGlass) {
    return (
      <div
        className="dark min-h-screen relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #3d1f5c 0%, #2a1445 25%, #1a0e30 50%, #1a1030 75%, #2d1248 100%)" }}
      >
        <div
          className="fixed top-[-20%] left-[-15%] w-[65%] h-[75%] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(230,100,140,0.25) 0%, transparent 55%)" }}
        />
        <div
          className="fixed top-[-15%] right-[-10%] w-[50%] h-[55%] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(240,170,110,0.18) 0%, transparent 55%)" }}
        />
        <div
          className="fixed bottom-[-15%] right-[10%] w-[55%] h-[60%] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(140,80,220,0.20) 0%, transparent 55%)" }}
        />
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(135deg, transparent, transparent 48px, rgba(255,255,255,0.07) 48px, rgba(255,255,255,0.07) 49px),
              repeating-linear-gradient(45deg, transparent, transparent 48px, rgba(255,255,255,0.05) 48px, rgba(255,255,255,0.05) 49px)
            `,
          }}
        />
        <div className={`relative z-10 min-h-screen ${className}`}>{children}</div>
      </div>
    );
  }

  return (
    <div className={`${isDark ? "dark" : ""} min-h-screen bg-gray-50 dark:bg-gray-950 ${className}`}>
      {children}
    </div>
  );
}
