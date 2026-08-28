"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../components/AuthContext";
import AuthModal from "../../components/AuthModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const STAGES = [
  { num: 1, part: 1, slug: "database/repl", name: "REPL" },
  { num: 2, part: 1, slug: "database/lexer", name: "Lexer" },
  { num: 3, part: 1, slug: "database/parser", name: "Parser" },
  { num: 4, part: 1, slug: "database/row-serialization", name: "Row Serialization" },
  { num: 5, part: 1, slug: "database/pager", name: "Pager" },
  { num: 6, part: 1, slug: "database/btree-leaf", name: "B-Tree Leaf" },
  { num: 7, part: 1, slug: "database/btree-search", name: "B-Tree Search" },
  { num: 8, part: 1, slug: "database/btree-split", name: "B-Tree Split" },
  { num: 9, part: 1, slug: "database/persistence", name: "Internal Split" },
  { num: 10, part: 1, slug: "database/planner", name: "Persistence" },
  { num: 11, part: 1, slug: "database/index-scan", name: "Planner" },
  { num: 12, part: 1, slug: "database/delete-update", name: "Delete & Update" },
  { num: 1, part: 2, slug: "advanced-storage/wal", name: "WAL" },
  { num: 2, part: 2, slug: "advanced-storage/commit", name: "Transaction Commit" },
  { num: 3, part: 2, slug: "advanced-storage/rollback", name: "Transaction Rollback" },
  { num: 4, part: 2, slug: "advanced-storage/create-table", name: "CREATE TABLE" },
  { num: 5, part: 2, slug: "advanced-storage/schema-validation", name: "Schema Validation" },
  { num: 6, part: 2, slug: "advanced-storage/varlen-serialization", name: "Varlen Serialization" },
  { num: 7, part: 2, slug: "advanced-storage/slotted-page", name: "Slotted Page" },
  { num: 8, part: 2, slug: "advanced-storage/varlen-btree", name: "Varlen B-Tree" },
  { num: 1, part: 3, slug: "complete-sql/advanced-where", name: "Advanced WHERE" },
  { num: 2, part: 3, slug: "complete-sql/order-by", name: "ORDER BY" },
  { num: 3, part: 3, slug: "complete-sql/limit-offset", name: "LIMIT/OFFSET" },
  { num: 4, part: 3, slug: "complete-sql/aggregations", name: "Aggregations" },
  { num: 5, part: 3, slug: "complete-sql/group-by-having", name: "GROUP BY" },
  { num: 6, part: 3, slug: "complete-sql/null-handling", name: "NULL Handling" },
  { num: 7, part: 3, slug: "complete-sql/additional-ddl", name: "Additional DDL" },
  { num: 1, part: 4, slug: "advanced-indexing/secondary-indexes", name: "Secondary Indexes" },
  { num: 2, part: 4, slug: "advanced-indexing/cost-optimizer", name: "Cost Optimizer" },
  { num: 3, part: 4, slug: "advanced-indexing/vacuum", name: "VACUUM" },
  { num: 1, part: 5, slug: "multi-table/joins-nested-loop", name: "Nested Loop Join" },
  { num: 2, part: 5, slug: "multi-table/hash-join", name: "Hash Join" },
  { num: 3, part: 5, slug: "multi-table/foreign-keys", name: "Foreign Keys" },
  { num: 4, part: 5, slug: "multi-table/subqueries", name: "Subqueries" },
  { num: 1, part: 6, slug: "concurrency/lock-manager", name: "Lock Manager" },
  { num: 2, part: 6, slug: "concurrency/mvcc", name: "MVCC" },
  { num: 3, part: 6, slug: "concurrency/deadlock-detection", name: "Deadlock Detection" },
];

const PART_NAMES = {
  1: "Fixed-Layout Database",
  2: "Advanced Storage & Transactions",
  3: "Complete SQL",
  4: "Advanced Indexing",
  5: "Multi-Table & Relational",
  6: "Concurrency",
};

export default function ProfilePage() {
  const { user, token, loading, logout } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [testDetails, setTestDetails] = useState({});

  useEffect(() => {
    if (loading || !user || !token) {
      setFetching(false);
      return;
    }
    fetch(`${API_BASE}/api/v1/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : [])
      .then(setSubmissions)
      .catch(() => setSubmissions([]))
      .finally(() => setFetching(false));
  }, [user, token, loading]);

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-guest">
          <h1>Your Profile</h1>
          <p>Log in or sign up to track your progress across all tutorial stages.</p>
          <button className="btn-glow-primary" onClick={() => setShowAuthModal(true)}>
            <span>Log In / Sign Up</span>
            <span className="btn-arrow">-&gt;</span>
          </button>
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => setShowAuthModal(false)}
            initialTab="login"
          />
        </div>
      </div>
    );
  }

  const bestByStage = {};
  for (const sub of submissions) {
    const key = sub.stage_slug;
    if (!bestByStage[key] || sub.status === "passed") {
      bestByStage[key] = sub;
    }
  }

  const groupedByPart = {};
  for (const stage of STAGES) {
    if (!groupedByPart[stage.part]) groupedByPart[stage.part] = [];
    groupedByPart[stage.part].push(stage);
  }

  const totalPassed = Object.values(bestByStage).filter((s) => s.status === "passed").length;

  return (
    <div className="profile-container">
      <header className="nav-top-bar">
        <Link href="/" className="nav-brand">
          <span>🗄️ Database Curriculum</span>
        </Link>
        <div className="nav-auth">
          <span className="nav-user-name">{user.name}</span>
          <button className="btn-login-ghost" onClick={logout}>Log Out</button>
        </div>
      </header>

      <div className="profile-header">
        <div className="profile-avatar">{user.name?.charAt(0).toUpperCase()}</div>
        <div>
          <h1 className="profile-name">{user.name}</h1>
          <p className="profile-email">{user.email}</p>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-number">{totalPassed}</span>
          <span className="profile-stat-label">stages passed</span>
        </div>
      </div>

      <section className="profile-section">
        <h2 className="profile-section-title">Stage Progress</h2>
        {Object.entries(groupedByPart).map(([partNum, stages]) => (
          <div key={partNum} className="progress-part-group">
            <h3 className="progress-part-title">
              Part {partNum}: {PART_NAMES[partNum]}
            </h3>
            <div className="progress-grid">
              {stages.map((stage) => {
                const best = bestByStage[stage.slug];
                let statusClass = "status-none";
                let statusLabel = "Not attempted";
                if (best) {
                  if (best.status === "passed") { statusClass = "status-passed"; statusLabel = "Passed"; }
                  else if (best.status === "failed") { statusClass = "status-failed"; statusLabel = "Failed"; }
                  else { statusClass = "status-pending"; statusLabel = best.status; }
                }
                return (
                  <Link
                    key={stage.slug}
                    href={`/stages/${stage.slug}`}
                    className={`progress-card ${statusClass}`}
                  >
                    <span className="progress-card-num">P{stage.part}.{stage.num}</span>
                    <span className="progress-card-name">{stage.name}</span>
                    <span className={`progress-badge ${statusClass}`}>{statusLabel}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="profile-section">
        <h2 className="profile-section-title">Submission History</h2>
        {fetching ? (
          <p className="profile-loading">Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <p className="profile-empty">No submissions yet. Start a tutorial stage to begin!</p>
        ) : (
          <div className="submissions-table-wrap">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Tests</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => {
                  const isExpanded = expandedId === sub.id;
                  const detail = testDetails[sub.id];
                  return (
                    <React.Fragment key={sub.id}>
                      <tr
                        className={`sub-row-clickable ${isExpanded ? "sub-row-expanded" : ""}`}
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedId(null);
                            return;
                          }
                          setExpandedId(sub.id);
                          if (!testDetails[sub.id]) {
                            fetch(`${API_BASE}/api/v1/submissions/${sub.id}`, {
                              headers: { Authorization: `Bearer ${token}` },
                            })
                              .then((r) => r.json())
                              .then((data) => setTestDetails((prev) => ({ ...prev, [sub.id]: data })))
                              .catch(() => {});
                          }
                        }}
                      >
                        <td>
                          <Link href={`/stages/${sub.stage_slug}`} className="sub-stage-link" onClick={(e) => e.stopPropagation()}>
                            {sub.stage_slug}
                          </Link>
                        </td>
                        <td className="sub-lang">{sub.language_slug}</td>
                        <td>
                          <span className={`sub-status sub-status-${sub.status}`}>{sub.status}</span>
                        </td>
                        <td>
                          {sub.test_run
                            ? `${sub.test_run.total_passed} / ${sub.test_run.total_passed + sub.test_run.total_failed}`
                            : "—"}
                        </td>
                        <td className="sub-date">{new Date(sub.created_at).toLocaleDateString()}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="sub-detail-row">
                          <td colSpan={5}>
                            {!detail ? (
                              <p className="sub-detail-loading">Loading test results...</p>
                            ) : !detail.test_run ? (
                              <p className="sub-detail-loading">No test results available.</p>
                            ) : (
                              <div className="sub-detail-content">
                                <div className="sub-detail-summary">
                                  <span className="sub-detail-passed">{detail.test_run.total_passed} passed</span>
                                  <span className="sub-detail-failed">{detail.test_run.total_failed} failed</span>
                                  {detail.test_run.duration_ms != null && (
                                    <span className="sub-detail-duration">{detail.test_run.duration_ms}ms</span>
                                  )}
                                </div>
                                <table className="sub-tests-table">
                                  <thead>
                                    <tr>
                                      <th></th>
                                      <th>Test</th>
                                      <th>Expected</th>
                                      <th>Actual</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {detail.test_run.test_cases.map((tc, i) => (
                                      <tr key={i} className={tc.passed ? "tc-passed" : "tc-failed"}>
                                        <td className="tc-icon">{tc.passed ? "✓" : "✗"}</td>
                                        <td className="tc-name">{tc.name}</td>
                                        <td className="tc-output"><code>{tc.expected || "—"}</code></td>
                                        <td className="tc-output"><code>{tc.actual || "—"}</code></td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
