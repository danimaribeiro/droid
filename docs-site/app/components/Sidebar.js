"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  {
    title: "Command Loop & The REPL",
    stages: [
      { num: 1, slug: "stage1-repl", title: "Building the CLI Interface" },
    ],
  },
  {
    title: "SQL Statement Compiler",
    stages: [
      { num: 2, slug: "stage2-lexer", title: "Lexical Analysis (Tokenizer)" },
      { num: 3, slug: "stage3-parser", title: "SQL Parser (Recursive Descent)" },
    ],
  },
  {
    title: "Data Row Serialization",
    stages: [
      { num: 4, slug: "stage4-serialization", title: "Compact Row Memory Packing" },
    ],
  },
  {
    title: "The Pager & Buffer Pool",
    stages: [
      { num: 5, slug: "stage5-pager", title: "Memory Caching & File Paging" },
    ],
  },
  {
    title: "The B-Tree Storage Engine",
    stages: [
      { num: 6, slug: "stage6-btree-leaf", title: "B-Tree Node Byte Layout" },
      { num: 7, slug: "stage7-btree-search", title: "Leaf Node Search & Insertion" },
      { num: 8, slug: "stage8-btree-split", title: "B-Tree Node Splits & Internal Nodes" },
    ],
  },
  {
    title: "Persistence & Query Execution",
    stages: [
      { num: 9, slug: "stage9-persistence", title: "Persistence & WHERE Clause" },
      { num: 10, slug: "stage10-planner", title: "Query Planner & Executor (Volcano)" },
    ],
  },
];

const IMPLEMENTED_STAGES = [1, 2, 3, 4];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  return (
    <aside className={`tutorial-sidebar ${isOpen ? "open" : ""}`}>
      <Link href="/" className="sidebar-logo">
        <span className="sidebar-logo-icon">🗄️</span>
        <div>
          <div className="sidebar-logo-title">Database Curriculum</div>
          <div className="sidebar-logo-subtitle">ALGORITHM COURSEWARE</div>
        </div>
      </Link>

      <nav className="sidebar-nav">
        {SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className="sidebar-section">
            <div className="sidebar-section-title">
              {sIdx + 1}. {section.title.toUpperCase()}
            </div>
            {section.stages.map((stage) => {
              const isActive = pathname === `/stages/${stage.slug}`;
              const isImplemented = IMPLEMENTED_STAGES.includes(stage.num);
              return (
                <Link
                  key={stage.slug}
                  href={`/stages/${stage.slug}`}
                  className={`sidebar-stage-link ${isActive ? "active" : ""} ${!isImplemented ? "coming-soon" : ""}`}
                >
                  <span className={`sidebar-stage-indicator ${isImplemented ? "done" : ""}`}>
                    {isImplemented ? "✓" : "○"}
                  </span>
                  <div>
                    <div className="sidebar-stage-title">{stage.title}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-progress">
          Stages Cleared: {IMPLEMENTED_STAGES.length} / {SECTIONS.reduce((acc, s) => acc + s.stages.length, 0)}
        </div>
      </div>
    </aside>
  );
}
