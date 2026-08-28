"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../components/AuthContext";
import { useTheme } from "../components/ThemeContext";
import AuthModal from "../components/AuthModal";
import GlassShell from "../components/GlassShell";
import ThemeSwitcher from "../components/ThemeSwitcher";
import TerminalPreview from "../components/TerminalPreview";
import { Cog, Zap, Brain, Search, Link2, Shield, ScrollText, GitBranch, HardDrive, Lock, FlaskConical, Lightbulb, Terminal, Target, Bot } from "lucide-react";

const PARTS = [
  { num: 1, name: "Fixed-Layout Database", description: "Build a working database from scratch with REPL, SQL parser, fixed-size rows, B-tree storage, Volcano planner, and DELETE/UPDATE.", Icon: Cog, tag: "CORE ENGINE", stages: "Stages 1–12", slug: "database/repl", ready: true, statusText: "STAGES 1–12 READY" },
  { num: 2, name: "Advanced Storage & Transactions", description: "Implement full transaction support with WAL, CREATE TABLE with schema catalog, and variable-length storage with slotted pages.", Icon: Zap, tag: "STORAGE & WAL", stages: "Stages 1–8", slug: "advanced-storage/wal", ready: false, statusText: "UNDER CONSTRUCTION" },
  { num: 3, name: "Complete SQL", description: "Implement advanced WHERE expressions, ORDER BY, LIMIT/OFFSET, aggregate functions, GROUP BY, NULL handling, and additional DDL.", Icon: Brain, tag: "COMPLETE SQL", stages: "Stages 1–4", slug: "complete-sql/advanced-where", ready: false, statusText: "UNDER CONSTRUCTION" },
  { num: 4, name: "Advanced Indexing", description: "Add secondary indexes, a cost-based query optimizer, and VACUUM for space reclamation.", Icon: Search, tag: "OPTIMIZATION", stages: "Stages 1–3", slug: "advanced-indexing/secondary-indexes", ready: false, statusText: "UNDER CONSTRUCTION" },
  { num: 5, name: "Multi-Table & Relational", description: "Implement JOINs (nested loop and hash), foreign key constraints, and subqueries.", Icon: Link2, tag: "RELATIONSHIPS", stages: "Stages 1–4", slug: "multi-table/joins-nested-loop", ready: false, statusText: "UNDER CONSTRUCTION" },
  { num: 6, name: "Concurrency", description: "Add a lock manager, Multi-Version Concurrency Control (MVCC), and deadlock detection.", Icon: Shield, tag: "CONCURRENCY", stages: "Stages 1–3", slug: "concurrency/lock-manager", ready: false, statusText: "UNDER CONSTRUCTION" },
];

const FEATURES = [
  { Icon: ScrollText, title: "Custom Lexer & Parser", description: "Write a character scanner and recursive descent AST builder from scratch without Yacc/Bison." },
  { Icon: GitBranch, title: "B-Tree Page Allocation", description: "Master 4KB binary disk pages, byte serialization, cell offsets, and B-Tree node splits." },
  { Icon: HardDrive, title: "WAL & Crash Durability", description: "Implement write-ahead logging and recovery algorithms to survive abrupt power losses." },
  { Icon: Zap, title: "Volcano Query Executor", description: "Build a pull-based iterative relational operator pipeline for SeqScan, IndexScan, and Joins." },
  { Icon: Lock, title: "MVCC & Transactions", description: "Handle multi-version concurrency control, transaction isolation, lock managers, and deadlocks." },
  { Icon: FlaskConical, title: "Contract-Driven Tests", description: "Validate your custom binary against comprehensive, language-agnostic integration test suites." },
];

const WORKFLOW_STEPS = [
  { num: "01", Icon: Lightbulb, title: "Understand the Architecture", desc: "Each stage breaks down complex systems into clear conceptual diagrams and straightforward checklists." },
  { num: "02", Icon: Terminal, title: "Write the Systems Code", desc: "Write true bare-metal algorithms in C, C++, Rust, or Zig. You allocate memory, handle binary file offsets, and build data representations directly." },
  { num: "03", Icon: Target, title: "Pass Automated Contracts", desc: "Run our comprehensive integration test harness against your binary to verify byte-exact storage output and SQL correctness." },
];

export default function HomePage() {
  const { user, logout } = useAuth();
  const { isGlass } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState("login");

  const g = isGlass; // shorthand

  return (
    <GlassShell>
      {/* Nav */}
      <header className={`sticky top-0 z-30 flex items-center justify-between px-6 h-14 ${g ? "bg-white/[0.10] backdrop-blur-2xl border-b border-white/[0.08]" : "bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"}`}>
        <Link href="/" className={`flex items-center gap-1.5 text-sm font-bold ${g ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>
          <Bot className="w-5 h-5" />
          droid
        </Link>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          {user ? (
            <>
              <Link href="/profile" className={`flex items-center gap-1.5 text-xs ${g ? "text-gray-200" : "text-gray-600 dark:text-gray-400"}`}>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold">{user.name?.[0]?.toUpperCase()}</span>
                <span className="hidden sm:inline">{user.name}</span>
              </Link>
              <button onClick={logout} className={`text-xs px-3 py-1.5 rounded-lg ${g ? "text-gray-300 hover:bg-white/[0.08]" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>Log Out</button>
            </>
          ) : (
            <>
              <button onClick={() => { setAuthTab("login"); setShowAuthModal(true); }} className={`text-xs px-3 py-1.5 rounded-lg ${g ? "text-gray-200 hover:bg-white/[0.08]" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>Log In</button>
              <button onClick={() => { setAuthTab("signup"); setShowAuthModal(true); }} className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium">Sign Up</button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6 ${g ? "bg-blue-500/20 text-blue-300 border border-blue-400/20" : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"}`}>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Interactive Database Internals Curriculum
            </div>

            <h1 className={`text-4xl lg:text-5xl font-extrabold leading-tight mb-6 ${g ? "text-white" : "text-gray-900 dark:text-white"}`}>
              Don't Just Query.<br />
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Build the Engine.</span>
            </h1>

            <p data-testid="hero-tagline" className={`text-lg mb-8 leading-relaxed max-w-lg ${g ? "text-gray-300" : "text-gray-600 dark:text-gray-400"}`}>
              A deep technical journey where you construct a full relational SQL storage engine from zero. Master lexical parsing, B-tree disk structures, buffer pools, WAL recovery, and query planners.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Link href="/stages/database/repl" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors">
                Start Part 1 Tutorial
                <span>→</span>
              </Link>
              <a href="https://github.com/danimaribeiro/droid" target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors ${g ? "border-white/[0.15] text-white hover:bg-white/[0.08]" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                Star on GitHub
              </a>
            </div>

            <div className={`flex items-center gap-3 ${g ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>
              <span className="text-[10px] font-semibold tracking-wider uppercase">Implement in:</span>
              <div className="flex gap-1.5">
                {[
                  { label: "C", bg: "#005fa3" },
                  { label: "C++", bg: "#9c33cf" },
                  { label: "Rust", bg: "#ce422b" },
                  { label: "Zig", bg: "#f7a41d", fg: "#000" },
                ].map((l) => (
                  <span key={l.label} data-testid={`chip-${l.label.toLowerCase().replace(/\+/g, "p")}`} className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: l.bg, color: l.fg || "#fff" }}>{l.label}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <TerminalPreview />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className={`inline-block text-[10px] font-bold tracking-widest uppercase mb-3 ${g ? "text-blue-400" : "text-blue-600 dark:text-blue-400"}`}>The Workflow</span>
          <h2 className={`text-3xl font-bold mb-3 ${g ? "text-white" : "text-gray-900 dark:text-white"}`}>How the Curriculum Works</h2>
          <p className={`max-w-xl mx-auto ${g ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>A battle-tested methodology inspired by industrial software systems.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {WORKFLOW_STEPS.map((step) => (
            <div key={step.num} className={`rounded-xl p-6 ${g ? "bg-white/[0.08] backdrop-blur-xl border border-white/[0.10] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`}>
              <div className={`text-[10px] font-bold tracking-wider mb-3 ${g ? "text-gray-500" : "text-gray-400 dark:text-gray-500"}`}>{step.num}</div>
              <step.Icon className={`w-6 h-6 mb-3 ${g ? "text-blue-400" : "text-blue-600 dark:text-blue-400"}`} />
              <h3 className={`text-sm font-semibold mb-2 ${g ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>{step.title}</h3>
              <p className={`text-xs leading-relaxed ${g ? "text-gray-300" : "text-gray-500 dark:text-gray-400"}`}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className={`py-16 ${g ? "" : "bg-gray-100/50 dark:bg-gray-900/50"}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className={`inline-block text-[10px] font-bold tracking-widest uppercase mb-3 ${g ? "text-blue-400" : "text-blue-600 dark:text-blue-400"}`}>System Internals</span>
            <h2 className={`text-3xl font-bold mb-3 ${g ? "text-white" : "text-gray-900 dark:text-white"}`}>What You Will Implement</h2>
            <p className={`max-w-xl mx-auto ${g ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>Every layer of a production database, constructed piece by piece.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feat, i) => (
              <div key={i} className={`rounded-xl p-5 ${g ? "bg-white/[0.06] backdrop-blur-xl border border-white/[0.08]" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`}>
                <feat.Icon className={`w-6 h-6 mb-3 ${g ? "text-purple-400" : "text-purple-600 dark:text-purple-400"}`} />
                <h3 className={`text-sm font-semibold mb-1.5 ${g ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>{feat.title}</h3>
                <p className={`text-xs leading-relaxed ${g ? "text-gray-300" : "text-gray-500 dark:text-gray-400"}`}>{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className={`inline-block text-[10px] font-bold tracking-widest uppercase mb-3 ${g ? "text-blue-400" : "text-blue-600 dark:text-blue-400"}`}>Roadmap & Progress</span>
          <h2 className={`text-3xl font-bold mb-3 ${g ? "text-white" : "text-gray-900 dark:text-white"}`}>The Complete Curriculum</h2>
          <p className={`max-w-xl mx-auto ${g ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>6 progressive stages from simple command loop to full concurrent DBMS.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PARTS.map((part) => (
            <Link key={part.num} href={`/stages/${part.slug}`} data-testid="roadmap-card" className={`block rounded-xl p-5 transition-colors group ${g ? "bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.10]" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold ${g ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>Part {part.num}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${part.ready ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : (g ? "bg-yellow-500/15 text-yellow-400" : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400")}`}>
                    {part.statusText}
                  </span>
                </div>
                <span className={`text-[9px] font-bold tracking-wider uppercase ${g ? "text-gray-500" : "text-gray-400 dark:text-gray-500"}`}>{part.tag}</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <part.Icon className={`w-5 h-5 ${g ? "text-blue-400" : "text-blue-600 dark:text-blue-400"}`} />
                <h3 className={`text-sm font-semibold ${g ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>{part.name}</h3>
              </div>

              <p className={`text-xs leading-relaxed mb-3 ${g ? "text-gray-300" : "text-gray-500 dark:text-gray-400"}`}>{part.description}</p>

              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-medium ${g ? "text-gray-500" : "text-gray-400 dark:text-gray-500"}`}>{part.stages}</span>
                <span className={`text-xs font-medium ${g ? "text-blue-400 group-hover:text-blue-300" : "text-blue-600 dark:text-blue-400"}`}>Explore →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Signup CTA */}
      {!user && (
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className={`rounded-xl p-8 text-center ${g ? "bg-white/[0.08] backdrop-blur-xl border border-white/[0.10]" : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"}`}>
            <span className={`inline-block text-[10px] font-bold tracking-widest uppercase mb-3 ${g ? "text-blue-400" : "text-blue-600 dark:text-blue-400"}`}>Save Your Progress</span>
            <h2 className={`text-2xl font-bold mb-3 ${g ? "text-white" : "text-gray-900 dark:text-white"}`}>Create a Free Account</h2>
            <p className={`mb-6 max-w-md mx-auto ${g ? "text-gray-300" : "text-gray-600 dark:text-gray-400"}`}>Record completed stages, track test executions, and save your workspace across machines.</p>
            <button onClick={() => { setAuthTab("signup"); setShowAuthModal(true); }} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700">
              Create Free Account →
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className={`py-12 text-center ${g ? "border-t border-white/[0.06]" : "border-t border-gray-200 dark:border-gray-800"}`}>
        <h2 className={`text-xl font-bold mb-2 ${g ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>Ready to dive into systems engineering?</h2>
        <p className={`mb-6 ${g ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>Pick up your favorite terminal and start with Stage 1.</p>
        <Link href="/stages/database/repl" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700">
          Begin Stage 1: The REPL →
        </Link>
      </footer>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
        initialTab={authTab}
      />
    </GlassShell>
  );
}
