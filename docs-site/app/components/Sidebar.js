"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ALL_PARTS = [
  {
    part: 1,
    name: "Fixed-Layout Database",
    sections: [
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
        title: "The B+Tree Storage Engine",
        stages: [
          { num: 6, slug: "stage6-btree-leaf", title: "B+Tree Leaf Node Byte Layout" },
          { num: 7, slug: "stage7-btree-search", title: "Logarithmic Search & Sorted Insertion" },
          { num: 8, slug: "stage8-btree-split", title: "Leaf Overflow Splits & Internal Nodes" },
          { num: 9, slug: "stage9-btree-internal-split", title: "B+Tree Internal Node Splits" },
        ],
      },
      {
        title: "Persistence & Query Execution",
        stages: [
          { num: 10, slug: "stage10-persistence", title: "Persistence & WHERE Clause" },
          { num: 11, slug: "stage11-planner", title: "Query Planner & Executor (Volcano)" },
          { num: 12, slug: "stage12-delete-update", title: "DELETE & UPDATE Execution" },
        ],
      },
    ],
  },
  {
    part: 2,
    name: "Advanced Storage & Transactions",
    sections: [
      {
        title: "Transactions & Durability",
        stages: [
          { num: 1, slug: "part2-stage1-wal", title: "Write-Ahead Logging (WAL)" },
          { num: 2, slug: "part2-stage2-transaction-commit", title: "Transaction COMMIT" },
          { num: 3, slug: "part2-stage3-transaction-rollback", title: "Transaction ROLLBACK" },
        ],
      },
      {
        title: "Schema & Catalog",
        stages: [
          { num: 4, slug: "part2-stage4-create-table", title: "CREATE TABLE & Schema Catalog" },
          { num: 5, slug: "part2-stage5-schema-validation", title: "Schema Validation" },
        ],
      },
      {
        title: "Variable-Length Storage",
        stages: [
          { num: 6, slug: "part2-stage6-varlen-serialization", title: "Variable-Length Row Serialization" },
          { num: 7, slug: "part2-stage7-slotted-page", title: "Slotted Page Layout" },
          { num: 8, slug: "part2-stage8-varlen-btree", title: "Variable-Length B-Tree" },
        ],
      },
    ],
  },
  {
    part: 3,
    name: "Complete SQL",
    sections: [
      {
        title: "Query Enhancements",
        stages: [
          { num: 1, slug: "part3-stage1-advanced-where", title: "Advanced WHERE Expressions" },
        ],
      },
      {
        title: "Result Processing",
        stages: [
          { num: 2, slug: "part3-stage2-order-by", title: "ORDER BY" },
          { num: 3, slug: "part3-stage3-limit-offset", title: "LIMIT & OFFSET" },
          { num: 4, slug: "part3-stage4-aggregations", title: "Aggregate Functions" },
          { num: 5, slug: "part3-stage5-group-by-having", title: "GROUP BY & HAVING" },
          { num: 6, slug: "part3-stage6-null-handling", title: "NULL Handling" },
          { num: 7, slug: "part3-stage7-additional-ddl", title: "Additional DDL (ALTER/DROP)" },
        ],
      },
    ],
  },
  {
    part: 4,
    name: "Advanced Indexing",
    sections: [
      {
        title: "Indexes & Optimization",
        stages: [
          { num: 1, slug: "part4-stage1-secondary-indexes", title: "Secondary Indexes" },
          { num: 2, slug: "part4-stage2-cost-optimizer", title: "Cost-Based Query Optimizer" },
          { num: 3, slug: "part4-stage3-vacuum", title: "VACUUM & Space Reclamation" },
        ],
      },
    ],
  },
  {
    part: 5,
    name: "Multi-Table & Relational",
    sections: [
      {
        title: "Joins & Relations",
        stages: [
          { num: 1, slug: "part5-stage1-joins-nested-loop", title: "Nested Loop JOIN" },
          { num: 2, slug: "part5-stage2-hash-join", title: "Hash JOIN" },
          { num: 3, slug: "part5-stage3-foreign-keys", title: "Foreign Key Constraints" },
          { num: 4, slug: "part5-stage4-subqueries", title: "Subqueries" },
        ],
      },
    ],
  },
  {
    part: 6,
    name: "Concurrency",
    sections: [
      {
        title: "Concurrent Access",
        stages: [
          { num: 1, slug: "part6-stage1-lock-manager", title: "Lock Manager" },
          { num: 2, slug: "part6-stage2-mvcc", title: "MVCC & Snapshot Isolation" },
          { num: 3, slug: "part6-stage3-deadlock-detection", title: "Deadlock Detection" },
        ],
      },
    ],
  },
];

// Stages with tutorial content ready
const IMPLEMENTED_STAGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * Find which part a given slug belongs to.
 */
function findPartForSlug(slug) {
  for (const part of ALL_PARTS) {
    for (const section of part.sections) {
      if (section.stages.some((s) => s.slug === slug)) {
        return part;
      }
    }
  }
  return ALL_PARTS[0]; // fallback
}

/**
 * Get the slug from a pathname like /stages/stage2-lexer
 */
function getSlugFromPathname(pathname) {
  const match = pathname.match(/\/stages\/(.+)/);
  return match ? match[1] : null;
}

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const currentSlug = getSlugFromPathname(pathname);
  const currentPart = currentSlug ? findPartForSlug(currentSlug) : ALL_PARTS[0];

  return (
    <aside className={`tutorial-sidebar ${isOpen ? "open" : ""}`}>
      <Link href="/" className="sidebar-logo">
        <span className="sidebar-logo-icon">🗄️</span>
        <div>
          <div className="sidebar-logo-title">Database Curriculum</div>
          <div className="sidebar-logo-subtitle">ALGORITHM COURSEWARE</div>
        </div>
      </Link>

      {/* Part selector */}
      <div className="sidebar-part-header">
        <span className="sidebar-part-badge">Part {currentPart.part}</span>
        <span className="sidebar-part-name">{currentPart.name}</span>
      </div>

      <nav className="sidebar-nav">
        {currentPart.sections.map((section, sIdx) => (
          <div key={sIdx} className="sidebar-section">
            <div className="sidebar-section-title">
              {section.title.toUpperCase()}
            </div>
            {section.stages.map((stage) => {
              const isActive = pathname === `/stages/${stage.slug}`;
              const isImplemented = currentPart.part === 1;
              return (
                <Link
                  key={stage.slug}
                  href={`/stages/${stage.slug}`}
                  className={`sidebar-stage-link ${isActive ? "active" : ""} ${!isImplemented ? "coming-soon" : ""}`}
                  onClick={onClose}
                >
                  <span className={`sidebar-stage-indicator ${isImplemented ? "done" : ""}`}>
                    {isImplemented ? "✓" : "○"}
                  </span>
                  <div>
                    <div className="sidebar-stage-title">
                      {stage.title}
                      {!isImplemented && (
                        <span style={{ marginLeft: "6px", fontSize: "10px", color: "#f59e0b", background: "rgba(245,158,11,0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                          🚧 SOON
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Part navigation */}
      <div className="sidebar-footer">
        <div className="sidebar-part-nav">
          {ALL_PARTS.map((p) => (
            <Link
              key={p.part}
              href={`/stages/${p.sections[0].stages[0].slug}`}
              className={`sidebar-part-dot ${p.part === currentPart.part ? "active" : ""}`}
              title={`Part ${p.part}: ${p.name}`}
            >
              {p.part}
            </Link>
          ))}
        </div>
        <div className="sidebar-progress">
          Stages: 12 / 37
        </div>
      </div>
    </aside>
  );
}

export { ALL_PARTS, IMPLEMENTED_STAGES };
