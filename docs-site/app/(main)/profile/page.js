"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthContext";
import { useTheme } from "../../components/ThemeContext";
import AuthModal from "../../components/AuthModal";
import GlassShell from "../../components/GlassShell";
import ThemeSwitcher from "../../components/ThemeSwitcher";
import {
  Bot, Pencil, Camera, Check, X, Eye, EyeOff,
  ChevronRight, ChevronDown, Trophy, Clock, Settings, BarChart3,
  History, RotateCcw, AlertTriangle, ExternalLink,
} from "lucide-react";

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
  { num: 9, part: 1, slug: "database/persistence", name: "Persistence" },
  { num: 10, part: 1, slug: "database/planner", name: "Planner" },
  { num: 11, part: 1, slug: "database/index-scan", name: "Index Scan" },
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
  const router = useRouter();
  const { user, token, loading, logout, updateUser } = useAuth();
  const { isGlass } = useTheme();
  const [submissions, setSubmissions] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [testDetails, setTestDetails] = useState({});
  const [activeTab, setActiveTab] = useState("progress");
  const [expandedParts, setExpandedParts] = useState({ 1: true });
  const [restoringId, setRestoringId] = useState(null);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [avatarSaving, setAvatarSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [resetConfirm, setResetConfirm] = useState(null);
  const [resetting, setResetting] = useState(false);

  const g = isGlass;

  const saveProfile = async (data) => {
    const res = await fetch(`${API_BASE}/api/v1/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || err.errors?.join(", ") || "Update failed");
    }
    const updated = await res.json();
    updateUser(updated);
    return updated;
  };

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === user.name) {
      setEditingName(false);
      return;
    }
    setNameSaving(true);
    try {
      await saveProfile({ name: nameValue.trim() });
      setEditingName(false);
    } catch {}
    setNameSaving(false);
  };

  const handleSavePassword = async () => {
    setPasswordError("");
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordSaving(true);
    try {
      await saveProfile({ current_password: currentPassword, password: newPassword });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => { setPasswordSuccess(false); setShowPasswordForm(false); }, 1500);
    } catch (e) {
      setPasswordError(e.message);
    }
    setPasswordSaving(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarSaving(true);
    try {
      const dataUrl = await new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const img = new Image();
        img.onload = () => {
          canvas.width = 128;
          canvas.height = 128;
          const ctx = canvas.getContext("2d");
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 128, 128);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.src = URL.createObjectURL(file);
      });
      await saveProfile({ avatar_url: dataUrl });
    } catch {}
    setAvatarSaving(false);
  };

  const handleResetProgress = async (stageSlug) => {
    setResetting(true);
    try {
      const params = stageSlug ? `?stage_slug=${encodeURIComponent(stageSlug)}` : "";
      const res = await fetch(`${API_BASE}/api/v1/me/progress${params}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (stageSlug) {
          setSubmissions((prev) => prev.filter((s) => s.stage_slug !== stageSlug));
        } else {
          setSubmissions([]);
        }
      }
    } catch {}
    setResetting(false);
    setResetConfirm(null);
  };

  const handleRestoreSubmission = async (submissionId) => {
    setRestoringId(submissionId);
    try {
      let detail = testDetails[submissionId];
      if (!detail) {
        const res = await fetch(`${API_BASE}/api/v1/submissions/${submissionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        detail = await res.json();
        setTestDetails((prev) => ({ ...prev, [submissionId]: detail }));
      }
      if (detail.code_files && Object.keys(detail.code_files).length > 0) {
        await fetch(`${API_BASE}/api/v1/workspaces/${detail.stage_slug}/${detail.language_slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ workspace: { code_files: detail.code_files } }),
        });
        try {
          localStorage.setItem(`droid_pg_${detail.stage_slug}_lang`, detail.language_slug);
        } catch {}
        router.push(`/playground/${detail.stage_slug}`);
      }
    } catch (err) {
      console.error("Failed to restore submission:", err);
    }
    setRestoringId(null);
  };

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

  const textPrimary = g ? "text-white" : "text-gray-900 dark:text-white";
  const textMuted = g ? "text-gray-400" : "text-gray-500 dark:text-gray-400";
  const textSecondary = g ? "text-gray-300" : "text-gray-700 dark:text-gray-300";
  const cardCls = g
    ? "bg-white/[0.06] backdrop-blur-xl border border-white/[0.10] rounded-xl"
    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm";
  const inputCls = g
    ? "bg-white/[0.08] text-white border border-white/[0.15] focus:border-purple-400 placeholder-gray-500"
    : "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 placeholder-gray-400";

  if (loading) {
    return (
      <GlassShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className={`text-sm ${textMuted}`}>Loading...</div>
        </div>
      </GlassShell>
    );
  }

  if (!user) {
    return (
      <GlassShell>
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <div className={`${cardCls} p-10 max-w-md w-full text-center`}>
            <span className="text-4xl">🗄️</span>
            <h1 className={`text-2xl font-bold mt-4 ${textPrimary}`}>Your Profile</h1>
            <p className={`text-sm mt-2 mb-6 ${textMuted}`}>
              Log in or sign up to track your progress across all tutorial stages.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className={`w-full py-3 rounded-lg text-sm font-semibold transition-all ${
                g
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25"
              }`}
            >
              Log In / Sign Up
            </button>
          </div>
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => setShowAuthModal(false)}
            initialTab="login"
          />
        </div>
      </GlassShell>
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
  const totalStages = STAGES.length;
  const progressPct = Math.round((totalPassed / totalStages) * 100);
  const uniqueLangs = new Set(submissions.map((s) => s.language_slug)).size;

  const togglePart = (partNum) => {
    setExpandedParts((prev) => ({ ...prev, [partNum]: !prev[partNum] }));
  };

  const tabs = [
    { id: "progress", label: "Progress", Icon: BarChart3 },
    { id: "submissions", label: "Submissions", Icon: History },
    { id: "account", label: "Account", Icon: Settings },
  ];

  return (
    <GlassShell>
      {/* Nav */}
      <header className={`sticky top-0 z-30 flex items-center justify-between px-6 h-14 ${
        g ? "bg-white/[0.10] backdrop-blur-2xl border-b border-white/[0.08]"
          : "bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"
      }`}>
        <Link href="/" className={`flex items-center gap-1.5 text-sm font-bold ${g ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>
          <Bot className="w-5 h-5" />
          droid
        </Link>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <button
            onClick={logout}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              g ? "text-gray-300 hover:text-white hover:bg-white/[0.08]"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Log Out
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative group shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10" />
            ) : (
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                g ? "bg-gradient-to-br from-purple-500/60 to-pink-500/60 text-white ring-2 ring-purple-400/20"
                  : "bg-gradient-to-br from-blue-500 to-blue-600 text-white ring-2 ring-blue-300/30"
              }`}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarSaving}
              className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50"
            >
              {avatarSaving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Camera className="w-4 h-4 text-white" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className={`text-lg font-bold ${textPrimary}`}>{user.name}</h1>
            <p className={`text-sm ${textMuted}`}>{user.email}</p>
          </div>

          <div className="hidden sm:flex items-center gap-6">
            <div className="text-center">
              <div className={`text-xl font-bold ${g ? "text-purple-300" : "text-blue-600 dark:text-blue-400"}`}>{totalPassed}</div>
              <div className={`text-[10px] uppercase tracking-wider font-medium ${textMuted}`}>Passed</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${textPrimary}`}>{submissions.length}</div>
              <div className={`text-[10px] uppercase tracking-wider font-medium ${textMuted}`}>Runs</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${textPrimary}`}>{uniqueLangs}</div>
              <div className={`text-[10px] uppercase tracking-wider font-medium ${textMuted}`}>Languages</div>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className={`${cardCls} p-4 mb-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium ${textMuted}`}>Overall Progress</span>
            <span className={`text-xs font-semibold ${textSecondary}`}>
              {totalPassed} / {totalStages} stages ({progressPct}%)
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${g ? "bg-white/[0.08]" : "bg-gray-100 dark:bg-gray-800"}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${g ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-blue-600"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex gap-1 mb-6 p-1 rounded-lg ${g ? "bg-white/[0.06]" : "bg-gray-100 dark:bg-gray-800"}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? g
                    ? "bg-white/[0.12] text-white shadow-sm"
                    : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : g
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <tab.Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "progress" && (
          <div className="space-y-3">
            {Object.entries(groupedByPart).map(([partNum, stages]) => {
              const partPassed = stages.filter((s) => bestByStage[s.slug]?.status === "passed").length;
              const partPct = Math.round((partPassed / stages.length) * 100);
              const isExpanded = expandedParts[partNum];

              return (
                <div key={partNum} className={cardCls}>
                  <button
                    onClick={() => togglePart(Number(partNum))}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <div className={`shrink-0 ${g ? "text-gray-400" : "text-gray-400 dark:text-gray-500"}`}>
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${textPrimary}`}>
                          Part {partNum}: {PART_NAMES[partNum]}
                        </span>
                        {partPassed === stages.length && partPassed > 0 && (
                          <Trophy className={`w-3.5 h-3.5 ${g ? "text-yellow-400" : "text-yellow-500"}`} />
                        )}
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${g ? "bg-white/[0.08]" : "bg-gray-100 dark:bg-gray-800"}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            partPassed === stages.length && partPassed > 0
                              ? g ? "bg-gradient-to-r from-yellow-400 to-amber-500" : "bg-green-500"
                              : g ? "bg-purple-500/70" : "bg-blue-500"
                          }`}
                          style={{ width: `${partPct}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-xs font-medium shrink-0 ${textMuted}`}>
                      {partPassed}/{stages.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className={`px-4 pb-4 border-t ${g ? "border-white/[0.06]" : "border-gray-100 dark:border-gray-800"}`}>
                      <div className="pt-3 space-y-1">
                        {stages.map((stage) => {
                          const best = bestByStage[stage.slug];
                          const status = best?.status || "none";
                          const isResettingThis = resetConfirm === stage.slug;

                          return (
                            <div
                              key={stage.slug}
                              className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                g ? "hover:bg-white/[0.04]" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              }`}
                            >
                              <div className="w-5 flex justify-center shrink-0">
                                {status === "passed" ? (
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                    g ? "bg-green-500/20 text-green-400" : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                  }`}>✓</div>
                                ) : status === "failed" ? (
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                    g ? "bg-red-500/20 text-red-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                  }`}>✗</div>
                                ) : (
                                  <div className={`w-2 h-2 rounded-full ${g ? "bg-white/[0.15]" : "bg-gray-200 dark:bg-gray-700"}`} />
                                )}
                              </div>

                              <Link
                                href={`/stages/${stage.slug}`}
                                className={`flex-1 text-sm ${
                                  status === "passed"
                                    ? g ? "text-gray-300" : "text-gray-600 dark:text-gray-400"
                                    : textPrimary
                                } hover:underline`}
                              >
                                <span className={`font-mono text-[10px] mr-2 ${textMuted}`}>{stage.num}.</span>
                                {stage.name}
                              </Link>

                              {best?.language_slug && (
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  g ? "bg-white/[0.06] text-gray-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                }`}>
                                  {best.language_slug}
                                </span>
                              )}

                              {status !== "none" && (
                                isResettingThis ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleResetProgress(stage.slug)}
                                      disabled={resetting}
                                      className="text-[10px] px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-medium"
                                    >
                                      {resetting ? "..." : "Reset"}
                                    </button>
                                    <button
                                      onClick={() => setResetConfirm(null)}
                                      className={`text-[10px] px-2 py-1 rounded font-medium ${
                                        g ? "bg-white/[0.08] text-gray-300 hover:bg-white/[0.12]" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                      }`}
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setResetConfirm(stage.slug)}
                                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                                      g ? "text-gray-500 hover:text-red-400 hover:bg-white/[0.06]"
                                        : "text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    }`}
                                    title="Reset stage"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                )
                              )}

                              <Link
                                href={`/playground/${stage.slug}`}
                                className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                                  g ? "text-purple-300 hover:bg-purple-500/10 hover:text-purple-200"
                                    : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                }`}
                              >
                                {status === "none" ? "Start" : "Open"}
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "submissions" && (
          <div>
            {fetching ? (
              <div className={`${cardCls} p-8 text-center`}>
                <p className={`text-sm ${textMuted}`}>Loading submissions...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className={`${cardCls} p-8 text-center`}>
                <Clock className={`w-8 h-8 mx-auto mb-3 ${textMuted}`} />
                <p className={`text-sm font-medium ${textPrimary}`}>No submissions yet</p>
                <p className={`text-xs mt-1 ${textMuted}`}>Start a tutorial stage to see your submission history here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {submissions.map((sub) => {
                  const isExpanded = expandedId === sub.id;
                  const detail = testDetails[sub.id];
                  const passed = sub.status === "passed";

                  return (
                    <div key={sub.id} className={cardCls}>
                      <button
                        onClick={() => {
                          if (isExpanded) { setExpandedId(null); return; }
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
                        className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                          passed
                            ? g ? "bg-green-500/20 text-green-400" : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            : g ? "bg-red-500/20 text-red-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        }`}>
                          {passed ? "✓" : "✗"}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium truncate ${textPrimary}`}>
                              {STAGES.find((s) => s.slug === sub.stage_slug)?.name || sub.stage_slug}
                            </span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                              g ? "bg-white/[0.06] text-gray-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                            }`}>
                              {sub.language_slug}
                            </span>
                          </div>
                          <div className={`text-[11px] mt-0.5 ${textMuted}`}>
                            {sub.test_run ? `${sub.test_run.total_passed}/${sub.test_run.total_passed + sub.test_run.total_failed} tests passed` : ""}
                            {sub.test_run ? " · " : ""}
                            {new Date(sub.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>

                        {passed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreSubmission(sub.id);
                            }}
                            disabled={restoringId === sub.id}
                            className={`shrink-0 flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                              g ? "text-purple-300 hover:bg-purple-500/10 hover:text-purple-200"
                                : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            }`}
                          >
                            {restoringId === sub.id ? (
                              <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                            ) : (
                              <ExternalLink className="w-3 h-3" />
                            )}
                            Open
                          </button>
                        )}

                        <div className={`shrink-0 ${textMuted}`}>
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className={`px-4 pb-4 border-t ${g ? "border-white/[0.06]" : "border-gray-100 dark:border-gray-800"}`}>
                          {!detail ? (
                            <p className={`text-sm text-center py-4 ${textMuted}`}>Loading test results...</p>
                          ) : !detail.test_run ? (
                            <p className={`text-sm text-center py-4 ${textMuted}`}>No test results available.</p>
                          ) : (
                            <div className={`mt-3 rounded-lg overflow-hidden font-mono text-xs ${
                              g ? "bg-black/40 border border-white/[0.06]" : "bg-gray-950 border border-gray-800"
                            }`}>
                              <div className={`flex items-center gap-2 px-3 py-2 ${
                                g ? "bg-white/[0.04] border-b border-white/[0.06]" : "bg-gray-900 border-b border-gray-800"
                              }`}>
                                <div className="flex gap-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                                </div>
                                <span className="text-gray-500 text-[10px]">test results</span>
                              </div>
                              <div className="p-3 space-y-0.5">
                                {detail.test_run.test_cases.map((tc, i) => (
                                  <div key={i}>
                                    <div className="flex items-start gap-2">
                                      <span className={tc.passed ? "text-green-400" : "text-red-400"}>
                                        {tc.passed ? "✓" : "✗"}
                                      </span>
                                      <span className={tc.passed ? "text-gray-400" : "text-gray-200"}>
                                        {tc.name}
                                      </span>
                                    </div>
                                    {!tc.passed && (tc.input || tc.expected || tc.actual) && (
                                      <div className="ml-5 mt-0.5 mb-1.5 pl-3 border-l-2 border-red-500/30 space-y-0.5">
                                        {tc.input && (
                                          <div>
                                            <span className="text-gray-500">   Input: </span>
                                            <span className="text-blue-300">{tc.input.replace(/\n/g, "\\n")}</span>
                                          </div>
                                        )}
                                        {tc.expected && (
                                          <div>
                                            <span className="text-gray-500">Expected: </span>
                                            <span className="text-gray-300">{tc.expected}</span>
                                          </div>
                                        )}
                                        {tc.actual && (
                                          <div>
                                            <span className="text-gray-500">     Got: </span>
                                            <span className="text-red-300">{tc.actual}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                                <div className={`mt-2 pt-2 border-t ${g ? "border-white/[0.06]" : "border-gray-800"}`}>
                                  <span className="text-green-400">{detail.test_run.total_passed} passed</span>
                                  {detail.test_run.total_failed > 0 && (
                                    <span className="text-red-400"> · {detail.test_run.total_failed} failed</span>
                                  )}
                                  {detail.test_run.duration_ms != null && (
                                    <span className="text-gray-500"> · {detail.test_run.duration_ms}ms</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "account" && (
          <div className="space-y-4">
            {/* Profile Info */}
            <div className={cardCls}>
              <div className="px-4 py-3 flex items-center gap-2">
                <Pencil className={`w-3.5 h-3.5 ${textMuted}`} />
                <span className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Profile</span>
              </div>
              <div className={`px-4 pb-4 border-t ${g ? "border-white/[0.06]" : "border-gray-100 dark:border-gray-800"}`}>
                <div className="pt-4 space-y-4">
                  <div>
                    <label className={`text-xs font-medium block mb-1.5 ${textMuted}`}>Display Name</label>
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={nameValue}
                          onChange={(e) => setNameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                          className={`flex-1 text-sm px-3 py-2 rounded-lg outline-none ${inputCls}`}
                        />
                        <button onClick={handleSaveName} disabled={nameSaving} className={`p-2 rounded-lg ${g ? "text-green-400 hover:bg-white/[0.08]" : "text-green-600 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingName(false)} className={`p-2 rounded-lg ${g ? "text-gray-400 hover:bg-white/[0.08]" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${textPrimary}`}>{user.name}</span>
                        <button
                          onClick={() => { setNameValue(user.name); setEditingName(true); }}
                          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                            g ? "text-gray-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.10]"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={`text-xs font-medium block mb-1.5 ${textMuted}`}>Email</label>
                    <span className={`text-sm ${textSecondary}`}>{user.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className={cardCls}>
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className={`w-3.5 h-3.5 ${textMuted}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Password</span>
                </div>
                {!showPasswordForm && (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      g ? "text-gray-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.10]"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    Change
                  </button>
                )}
              </div>
              {showPasswordForm && (
                <div className={`px-4 pb-4 border-t ${g ? "border-white/[0.06]" : "border-gray-100 dark:border-gray-800"}`}>
                  <div className="pt-4 space-y-3 max-w-sm">
                    <div className="relative">
                      <input
                        type={showCurrent ? "text" : "password"}
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={`w-full text-sm px-3 py-2 pr-9 rounded-lg outline-none ${inputCls}`}
                      />
                      <button type="button" onClick={() => setShowCurrent(!showCurrent)} className={`absolute right-2.5 top-2.5 ${textMuted}`}>
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showNew ? "text" : "password"}
                        placeholder="New password (min 6 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`w-full text-sm px-3 py-2 pr-9 rounded-lg outline-none ${inputCls}`}
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)} className={`absolute right-2.5 top-2.5 ${textMuted}`}>
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <input
                      type={showNew ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full text-sm px-3 py-2 rounded-lg outline-none ${inputCls}`}
                    />
                    {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
                    {passwordSuccess && <p className={`text-xs ${g ? "text-green-400" : "text-green-600"}`}>Password updated!</p>}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSavePassword}
                        disabled={passwordSaving}
                        className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors ${
                          g ? "bg-purple-500 hover:bg-purple-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {passwordSaving ? "Saving..." : "Update Password"}
                      </button>
                      <button
                        onClick={() => { setShowPasswordForm(false); setPasswordError(""); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}
                        className={`text-xs px-3 py-2 rounded-lg transition-colors ${
                          g ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-white"
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className={`${g ? "bg-red-500/[0.06] backdrop-blur-xl border border-red-500/[0.15] rounded-xl" : "bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl"}`}>
              <div className="px-4 py-3 flex items-center gap-2">
                <AlertTriangle className={`w-3.5 h-3.5 ${g ? "text-red-400" : "text-red-500 dark:text-red-400"}`} />
                <span className={`text-xs font-semibold uppercase tracking-wider ${g ? "text-red-300" : "text-red-600 dark:text-red-400"}`}>Danger Zone</span>
              </div>
              <div className={`px-4 pb-4 border-t ${g ? "border-red-500/[0.08]" : "border-red-200/50 dark:border-red-800/20"}`}>
                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <span className={`text-sm font-medium ${textPrimary}`}>Reset All Progress</span>
                    <p className={`text-xs mt-0.5 ${textMuted}`}>Delete all submissions and saved workspaces. Cannot be undone.</p>
                  </div>
                  {resetConfirm === "all" ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleResetProgress(null)}
                        disabled={resetting}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                      >
                        {resetting ? "Resetting..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => setResetConfirm(null)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                          g ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-white"
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setResetConfirm("all")}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors border shrink-0 ${
                        g ? "text-red-300 hover:text-red-200 hover:bg-red-500/10 border-red-500/20"
                          : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800/40"
                      }`}
                    >
                      Reset All
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassShell>
  );
}
