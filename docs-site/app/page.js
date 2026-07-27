import Link from "next/link";
import { getPartInfo } from "@/lib/stages";

const PART_ICONS = {
  1: "🏗️",
  2: "📦",
  3: "🔍",
  4: "⚡",
  5: "🔗",
  6: "🔒",
};

const PART_STAGE_RANGES = {
  1: "Stages 1–10",
  2: "Stages 11–18",
  3: "Stages 19–23",
  4: "Stages 24–26",
  5: "Stages 27–30",
  6: "Stages 31–33",
};

const PART_FIRST_SLUG = {
  1: "stage1-repl",
  2: "stage11-varlen-serialization",
  3: "stage19-delete-update",
  4: "stage24-secondary-indexes",
  5: "stage27-joins-nested-loop",
  6: "stage31-lock-manager",
};

const HIGHLIGHTS = [
  { icon: "⌨️", title: "SQL Parser", desc: "Lexer, recursive descent, AST" },
  { icon: "🌳", title: "B-Tree Engine", desc: "Leaf nodes, splits, search" },
  { icon: "💾", title: "Persistence", desc: "Pager, buffer pool, disk I/O" },
  { icon: "📝", title: "WAL & Transactions", desc: "Crash recovery, ACID" },
  { icon: "🧠", title: "Query Optimizer", desc: "Cost-based planning, indexes" },
  { icon: "🔄", title: "Concurrency", desc: "Locks, MVCC, deadlock detection" },
];

export default function HomePage() {
  const parts = getPartInfo();

  return (
    <>
      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-label">Hands-on Tutorial</div>
          <h1 className="landing-hero-title">
            Build a <span>Database Engine</span>
            <br />
            From Scratch
          </h1>
          <p className="landing-hero-subtitle">
            Implement a complete database from the ground up — 
            SQL parser, B-tree storage, transactions, query optimization,
            and more. Choose your language: C, C++, Rust, or Zig.
          </p>
          <div className="landing-hero-actions">
            <Link href="/stages/stage1-repl" className="landing-btn-primary">
              Start Building →
            </Link>
          </div>
          <div className="landing-hero-stats">
            <div className="landing-stat">
              <span className="landing-stat-value">33</span>
              <span className="landing-stat-label">Stages</span>
            </div>
            <div className="landing-stat-sep" />
            <div className="landing-stat">
              <span className="landing-stat-value">6</span>
              <span className="landing-stat-label">Parts</span>
            </div>
            <div className="landing-stat-sep" />
            <div className="landing-stat">
              <span className="landing-stat-value">4</span>
              <span className="landing-stat-label">Languages</span>
            </div>
          </div>
        </div>
      </section>

      {/* What you'll build */}
      <section className="landing-section">
        <h2 className="landing-section-title">What You'll Build</h2>
        <p className="landing-section-subtitle">
          Every component of a real database — from scratch, in your language.
        </p>
        <div className="landing-highlights">
          {HIGHLIGHTS.map((h, i) => (
            <div key={i} className="landing-highlight-card">
              <span className="landing-highlight-icon">{h.icon}</span>
              <div className="landing-highlight-title">{h.title}</div>
              <div className="landing-highlight-desc">{h.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The Journey */}
      <section className="landing-section">
        <h2 className="landing-section-title">The Journey</h2>
        <p className="landing-section-subtitle">
          6 parts, 33 stages. Each part builds on the previous one.
        </p>
        <div className="landing-parts">
          {parts.map((part) => (
            <Link
              key={part.num}
              href={`/stages/${PART_FIRST_SLUG[part.num]}`}
              className="landing-part-card"
            >
              <div className="landing-part-card-header">
                <span className="landing-part-icon">{PART_ICONS[part.num]}</span>
                <div>
                  <div className="landing-part-label">Part {part.num}</div>
                  <div className="landing-part-name">{part.name}</div>
                </div>
              </div>
              <p className="landing-part-desc">{part.description}</p>
              <div className="landing-part-footer">
                <span className="landing-part-stages">{PART_STAGE_RANGES[part.num]}</span>
                <span className="landing-part-arrow">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
