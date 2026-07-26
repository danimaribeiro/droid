"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PARTS = [
  {
    num: 1,
    name: "Fixed-Layout Database",
    stages: [
      { num: 1, slug: "stage1-repl", title: "User REPL" },
      { num: 2, slug: "stage2-lexer", title: "SQL Lexer" },
      { num: 3, slug: "stage3-parser", title: "SQL Parser" },
      { num: 4, slug: "stage4-serialization", title: "Row Serialization" },
      { num: 5, slug: "stage5-pager", title: "Pager & Buffer Pool" },
      { num: 6, slug: "stage6-btree-leaf", title: "B-Tree Leaf & INSERT" },
      { num: 7, slug: "stage7-btree-search", title: "B-Tree Search & SELECT" },
      { num: 8, slug: "stage8-btree-split", title: "B-Tree Splits" },
      { num: 9, slug: "stage9-persistence", title: "Persistence & WHERE" },
      { num: 10, slug: "stage10-planner", title: "Query Planner" },
    ],
  },
  {
    num: 2,
    name: "Storage & Transactions",
    stages: [
      { num: 11, slug: "stage11-varlen-serialization", title: "Variable-Length Rows" },
      { num: 12, slug: "stage12-slotted-page", title: "Slotted Pages" },
      { num: 13, slug: "stage13-varlen-btree", title: "Variable-Length B-Tree" },
      { num: 14, slug: "stage14-create-table", title: "CREATE TABLE" },
      { num: 15, slug: "stage15-schema-validation", title: "Schema Validation" },
      { num: 16, slug: "stage16-transaction-commit", title: "BEGIN / COMMIT" },
      { num: 17, slug: "stage17-transaction-rollback", title: "ROLLBACK & Undo Log" },
      { num: 18, slug: "stage18-wal", title: "WAL & Crash Recovery" },
    ],
  },
  {
    num: 3,
    name: "Complete SQL",
    stages: [
      { num: 19, slug: "stage19-delete-update", title: "DELETE & UPDATE" },
      { num: 20, slug: "stage20-advanced-where", title: "Advanced WHERE" },
      { num: 21, slug: "stage21-order-by", title: "ORDER BY & Sorting" },
      { num: 22, slug: "stage22-limit-offset", title: "LIMIT / OFFSET" },
      { num: 23, slug: "stage23-aggregations", title: "Aggregations & GROUP BY" },
    ],
  },
  {
    num: 4,
    name: "Advanced Indexing",
    stages: [
      { num: 24, slug: "stage24-secondary-indexes", title: "Secondary Indexes" },
      { num: 25, slug: "stage25-cost-optimizer", title: "Cost-Based Optimizer" },
      { num: 26, slug: "stage26-vacuum", title: "VACUUM / Compaction" },
    ],
  },
  {
    num: 5,
    name: "Relational",
    stages: [
      { num: 27, slug: "stage27-joins-nested-loop", title: "JOINs (Nested Loop)" },
      { num: 28, slug: "stage28-hash-join", title: "Hash Join" },
      { num: 29, slug: "stage29-foreign-keys", title: "Foreign Keys" },
      { num: 30, slug: "stage30-subqueries", title: "Subqueries" },
    ],
  },
  {
    num: 6,
    name: "Concurrency",
    stages: [
      { num: 31, slug: "stage31-lock-manager", title: "Lock Manager" },
      { num: 32, slug: "stage32-mvcc", title: "MVCC" },
      { num: 33, slug: "stage33-deadlock-detection", title: "Deadlock Detection" },
    ],
  },
];

const EXTRAS = [
  { slug: "extra-result-set", title: "Result Set Architecture" },
  { slug: "extra-error-handling", title: "Error Handling" },
  { slug: "extra-wire-protocol", title: "PostgreSQL Wire Protocol" },
  { slug: "extra-type-system", title: "Extended Type System" },
  { slug: "extra-builtin-functions", title: "Built-in Functions" },
  { slug: "extra-views", title: "Views" },
  { slug: "extra-prepared-statements", title: "Prepared Statements" },
  { slug: "extra-alter-table", title: "ALTER TABLE" },
  { slug: "extra-drop-truncate", title: "DROP & TRUNCATE" },
  { slug: "extra-distinct-set-ops", title: "DISTINCT & Set Ops" },
  { slug: "extra-lsm-tree", title: "LSM-Tree" },
  { slug: "extra-page-compression", title: "Page Compression" },
  { slug: "extra-explain-analyze", title: "EXPLAIN ANALYZE" },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <Link href="/" className="sidebar-logo" onClick={onClose}>
            droid
          </Link>
          <div className="sidebar-subtitle">Database Internals</div>
        </div>
        <nav className="sidebar-nav">
          {PARTS.map((part) => (
            <div key={part.num} className="sidebar-section">
              <div className="sidebar-section-title">Part {part.num} — {part.name}</div>
              {part.stages.map((stage) => (
                <Link
                  key={stage.slug}
                  href={`/stages/${stage.slug}`}
                  className={`sidebar-link ${pathname === `/stages/${stage.slug}` ? "active" : ""}`}
                  onClick={onClose}
                >
                  <span className="sidebar-link-num">{stage.num}</span>
                  {stage.title}
                </Link>
              ))}
            </div>
          ))}
          <div className="sidebar-section">
            <div className="sidebar-section-title">Extras</div>
            {EXTRAS.map((extra) => (
              <Link
                key={extra.slug}
                href={`/stages/${extra.slug}`}
                className={`sidebar-link ${pathname === `/stages/${extra.slug}` ? "active" : ""}`}
                onClick={onClose}
              >
                <span className="sidebar-link-num">✦</span>
                {extra.title}
              </Link>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
