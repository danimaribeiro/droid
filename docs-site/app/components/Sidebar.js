"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeContext";
import { useAuth } from "./AuthContext";
import { Bot, Check } from "lucide-react";

const ALL_PARTS = [
  {
    part: 1,
    name: "Fixed-Layout Database",
    sections: [
      {
        title: "Command Loop & The REPL",
        stages: [
          { num: 1, slug: "database/repl", title: "Building the CLI Interface" },
        ],
      },
      {
        title: "SQL Statement Compiler",
        stages: [
          { num: 2, slug: "database/lexer", title: "Lexical Analysis (Tokenizer)" },
          { num: 3, slug: "database/parser", title: "SQL Parser (Recursive Descent)" },
        ],
      },
      {
        title: "Data Row Serialization",
        stages: [
          { num: 4, slug: "database/row-serialization", title: "Compact Row Memory Packing" },
        ],
      },
      {
        title: "The Pager & Buffer Pool",
        stages: [
          { num: 5, slug: "database/pager", title: "Memory Caching & File Paging" },
        ],
      },
      {
        title: "The B+Tree Storage Engine",
        stages: [
          { num: 6, slug: "database/btree-leaf", title: "B+Tree Leaf Node Byte Layout" },
          { num: 7, slug: "database/btree-search", title: "Logarithmic Search & Sorted Insertion" },
          { num: 8, slug: "database/btree-split", title: "Leaf Overflow Splits & Internal Nodes" },
          { num: 9, slug: "database/persistence", title: "B+Tree Internal Node Splits" },
        ],
      },
      {
        title: "Persistence & Query Execution",
        stages: [
          { num: 10, slug: "database/planner", title: "Persistence & WHERE Clause" },
          { num: 11, slug: "database/index-scan", title: "Query Planner & Executor (Volcano)" },
          { num: 12, slug: "database/delete-update", title: "DELETE & UPDATE Execution" },
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
          { num: 1, slug: "advanced-storage/wal", title: "Write-Ahead Logging (WAL)" },
          { num: 2, slug: "advanced-storage/commit", title: "Transaction COMMIT" },
          { num: 3, slug: "advanced-storage/rollback", title: "Transaction ROLLBACK" },
        ],
      },
      {
        title: "Schema & Catalog",
        stages: [
          { num: 4, slug: "advanced-storage/create-table", title: "CREATE TABLE & Schema Catalog" },
          { num: 5, slug: "advanced-storage/schema-validation", title: "Schema Validation" },
        ],
      },
      {
        title: "Variable-Length Storage",
        stages: [
          { num: 6, slug: "advanced-storage/varlen-serialization", title: "Variable-Length Row Serialization" },
          { num: 7, slug: "advanced-storage/slotted-page", title: "Slotted Page Layout" },
          { num: 8, slug: "advanced-storage/varlen-btree", title: "Variable-Length B-Tree" },
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
          { num: 1, slug: "complete-sql/advanced-where", title: "Advanced WHERE Expressions" },
        ],
      },
      {
        title: "Result Processing",
        stages: [
          { num: 2, slug: "complete-sql/order-by", title: "ORDER BY" },
          { num: 3, slug: "complete-sql/limit-offset", title: "LIMIT & OFFSET" },
          { num: 4, slug: "complete-sql/aggregations", title: "Aggregate Functions" },
          { num: 5, slug: "complete-sql/group-by-having", title: "GROUP BY & HAVING" },
          { num: 6, slug: "complete-sql/null-handling", title: "NULL Handling" },
          { num: 7, slug: "complete-sql/additional-ddl", title: "Additional DDL (ALTER/DROP)" },
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
          { num: 1, slug: "advanced-indexing/secondary-indexes", title: "Secondary Indexes" },
          { num: 2, slug: "advanced-indexing/cost-optimizer", title: "Cost-Based Query Optimizer" },
          { num: 3, slug: "advanced-indexing/vacuum", title: "VACUUM & Space Reclamation" },
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
          { num: 1, slug: "multi-table/joins-nested-loop", title: "Nested Loop JOIN" },
          { num: 2, slug: "multi-table/hash-join", title: "Hash JOIN" },
          { num: 3, slug: "multi-table/foreign-keys", title: "Foreign Key Constraints" },
          { num: 4, slug: "multi-table/subqueries", title: "Subqueries" },
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
          { num: 1, slug: "concurrency/lock-manager", title: "Lock Manager" },
          { num: 2, slug: "concurrency/mvcc", title: "MVCC & Snapshot Isolation" },
          { num: 3, slug: "concurrency/deadlock-detection", title: "Deadlock Detection" },
        ],
      },
    ],
  },
];

const IMPLEMENTED_STAGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function findPartForSlug(slug) {
  for (const part of ALL_PARTS) {
    for (const section of part.sections) {
      if (section.stages.some((s) => s.slug === slug)) {
        return part;
      }
    }
  }
  return ALL_PARTS[0];
}

function getSlugFromPathname(pathname) {
  const match = pathname.match(/\/(?:stages|playground)\/(.+)/);
  return match ? match[1] : null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { isGlass } = useTheme();
  const { token } = useAuth();
  const [passedSlugs, setPassedSlugs] = useState(new Set());

  useEffect(() => {
    if (!token) { setPassedSlugs(new Set()); return; }
    fetch(`${API_BASE}/api/v1/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : [])
      .then((subs) => {
        const passed = new Set();
        for (const s of subs) {
          if (s.status === "pass") passed.add(s.stage_slug);
        }
        setPassedSlugs(passed);
      })
      .catch(() => {});
  }, [token]);

  const currentSlug = getSlugFromPathname(pathname);
  const currentPart = currentSlug ? findPartForSlug(currentSlug) : ALL_PARTS[0];

  const border = isGlass ? "border-white/[0.10]" : "border-gray-200 dark:border-gray-700";

  return (
    <aside
      className={`${isOpen ? "fixed inset-y-0 left-0 z-50 w-72" : "hidden lg:flex"} flex-col w-72 shrink-0 h-screen ${
        isGlass
          ? "bg-white/[0.10] backdrop-blur-xl border-r border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
          : `bg-white dark:bg-gray-900 border-r ${border}`
      }`}
    >
      {/* Logo */}
      <Link
        href="/"
        className={`flex items-center gap-3 px-5 py-4 border-b ${border} ${
          isGlass ? "hover:bg-white/[0.06]" : "hover:bg-gray-50 dark:hover:bg-gray-800"
        } transition-colors`}
      >
        <Bot className={`w-6 h-6 ${isGlass ? "text-purple-400" : "text-blue-600 dark:text-purple-400"}`} />
        <div>
          <div className={`text-sm font-semibold ${isGlass ? "text-white" : "text-gray-900 dark:text-white"}`}>
            Database Curriculum
          </div>
          <div className={`text-[10px] font-medium tracking-wider uppercase ${isGlass ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>
            Algorithm Courseware
          </div>
        </div>
      </Link>

      {/* Part selector */}
      <div className={`flex items-center gap-2 px-5 py-3 border-b ${border}`}>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
          isGlass
            ? "bg-purple-500/30 text-purple-200"
            : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
        }`}>
          Part {currentPart.part}
        </span>
        <span className={`text-xs font-medium ${isGlass ? "text-gray-200" : "text-gray-700 dark:text-gray-300"}`}>
          {currentPart.name}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {currentPart.sections.map((section, sIdx) => (
          <div key={sIdx}>
            <div className={`text-[10px] font-semibold tracking-wider uppercase px-2 mb-1.5 ${
              isGlass ? "text-gray-400" : "text-gray-500 dark:text-gray-400"
            }`}>
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.stages.map((stage) => {
                const isActive = pathname === `/stages/${stage.slug}` || pathname === `/playground/${stage.slug}`;
                const isPassed = passedSlugs.has(stage.slug);
                const isAvailable = IMPLEMENTED_STAGES.includes(stage.num);
                return (
                  <Link
                    key={stage.slug}
                    href={`/stages/${stage.slug}`}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? isGlass
                          ? "bg-white/[0.12] text-white"
                          : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : isPassed
                          ? isGlass
                            ? "bg-green-500/[0.08] text-green-200 hover:bg-green-500/[0.14]"
                            : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                          : isGlass
                            ? "text-gray-200 hover:bg-white/[0.06] hover:text-white"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    } ${!isAvailable ? "opacity-60" : ""}`}
                  >
                    {isPassed ? (
                      <span className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
                        isGlass
                          ? "bg-green-500/20 text-green-300"
                          : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      }`}>
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${
                        isGlass
                          ? "border border-white/[0.15] text-gray-400"
                          : "border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"
                      }`}>
                        {stage.num}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-[13px] leading-tight">
                        {stage.title}
                        {!isAvailable && (
                          <span className="ml-1.5 text-[9px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            SOON
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={`px-5 py-3 border-t ${border} space-y-2`}>
        <div className="flex items-center justify-center gap-1">
          {ALL_PARTS.map((p) => (
            <Link
              key={p.part}
              href={`/stages/${p.sections[0].stages[0].slug}`}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                p.part === currentPart.part
                  ? isGlass
                    ? "bg-white/[0.15] text-white"
                    : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                  : isGlass
                    ? "text-gray-400 hover:bg-white/[0.08] hover:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title={`Part ${p.part}: ${p.name}`}
            >
              {p.part}
            </Link>
          ))}
        </div>
        <div className={`text-center text-[11px] ${isGlass ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>
          Stages: 12 / 37
        </div>
      </div>
    </aside>
  );
}

export { ALL_PARTS, IMPLEMENTED_STAGES };
