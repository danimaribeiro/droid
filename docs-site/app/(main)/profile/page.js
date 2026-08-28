"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "../../components/AuthContext";
import { useTheme } from "../../components/ThemeContext";
import AuthModal from "../../components/AuthModal";
import GlassShell from "../../components/GlassShell";
import ThemeSwitcher from "../../components/ThemeSwitcher";
import { Bot, Pencil, Camera, Check, X, Eye, EyeOff } from "lucide-react";

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

function StatusBadge({ status, isGlass }) {
  const styles = {
    passed: isGlass
      ? "bg-green-500/20 text-green-300 border-green-500/20"
      : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/40",
    failed: isGlass
      ? "bg-red-500/20 text-red-300 border-red-500/20"
      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40",
    none: isGlass
      ? "bg-white/[0.06] text-gray-400 border-white/[0.08]"
      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  };
  const label = status === "passed" ? "Passed" : status === "failed" ? "Failed" : "Not attempted";
  const key = status === "passed" ? "passed" : status === "failed" ? "failed" : "none";
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${styles[key]}`}>
      {label}
    </span>
  );
}

export default function ProfilePage() {
  const { user, token, loading, logout, updateUser } = useAuth();
  const { isGlass } = useTheme();
  const [submissions, setSubmissions] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [testDetails, setTestDetails] = useState({});

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

  const border = isGlass ? "border-white/[0.10]" : "border-gray-200 dark:border-gray-700";
  const cardCls = isGlass
    ? "bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] rounded-xl"
    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm";
  const textPrimary = isGlass ? "text-white" : "text-gray-900 dark:text-white";
  const textMuted = isGlass ? "text-gray-400" : "text-gray-500 dark:text-gray-400";

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
                isGlass
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

  return (
    <GlassShell>
      {/* Nav bar */}
      <header className={`flex items-center justify-between px-6 py-3 border-b ${border} ${
        isGlass ? "bg-white/[0.08] backdrop-blur-xl" : "bg-white dark:bg-gray-900"
      }`}>
        <Link href="/" className={`flex items-center gap-2 text-sm font-medium ${
          isGlass ? "text-gray-300 hover:text-white" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        } transition-colors`}>
          <Bot className="w-5 h-5" />
          droid
        </Link>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <span className={`text-sm font-medium ${isGlass ? "text-gray-200" : "text-gray-700 dark:text-gray-300"}`}>
            {user.name}
          </span>
          <button
            onClick={logout}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              isGlass
                ? "text-gray-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.10]"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
            }`}
          >
            Log Out
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Profile header card */}
        <div className={`${cardCls} p-6`}>
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative group">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-16 h-16 rounded-2xl object-cover"
                />
              ) : (
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${
                  isGlass
                    ? "bg-gradient-to-br from-purple-500/40 to-pink-500/40 text-white"
                    : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                }`}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarSaving}
                className={`absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                  isGlass ? "bg-black/50" : "bg-black/40"
                }`}
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              {avatarSaving && (
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Name / Email */}
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                    className={`text-xl font-bold px-2 py-1 rounded-lg w-full outline-none ${
                      isGlass
                        ? "bg-white/[0.1] text-white border border-white/20 focus:border-purple-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500"
                    }`}
                  />
                  <button onClick={handleSaveName} disabled={nameSaving} className={`p-1.5 rounded-lg ${isGlass ? "text-green-400 hover:bg-white/[0.08]" : "text-green-600 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingName(false)} className={`p-1.5 rounded-lg ${isGlass ? "text-gray-400 hover:bg-white/[0.08]" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className={`text-xl font-bold ${textPrimary}`}>{user.name}</h1>
                  <button
                    onClick={() => { setNameValue(user.name); setEditingName(true); }}
                    className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity ${
                      isGlass ? "text-gray-400 hover:text-white hover:bg-white/[0.08]" : "text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className={`text-sm ${textMuted}`}>{user.email}</p>
            </div>

            <div className="text-center">
              <div className={`text-3xl font-bold ${isGlass ? "text-purple-300" : "text-blue-600 dark:text-blue-400"}`}>
                {totalPassed}
              </div>
              <div className={`text-xs ${textMuted}`}>stages passed</div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-medium ${textMuted}`}>Overall Progress</span>
              <span className={`text-xs font-semibold ${isGlass ? "text-gray-200" : "text-gray-700 dark:text-gray-300"}`}>
                {totalPassed} / {totalStages} ({progressPct}%)
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${
              isGlass ? "bg-white/[0.08]" : "bg-gray-200 dark:bg-gray-700"
            }`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isGlass
                    ? "bg-gradient-to-r from-purple-500 to-pink-500"
                    : "bg-blue-600"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Account settings */}
          <div className={`mt-5 pt-5 border-t ${border}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${textPrimary}`}>Password</span>
              {showPasswordForm ? null : (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    isGlass
                      ? "text-gray-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.10]"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  Change Password
                </button>
              )}
            </div>
            {showPasswordForm && (
              <div className="mt-3 space-y-3 max-w-sm">
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full text-sm px-3 py-2 pr-9 rounded-lg outline-none ${
                      isGlass
                        ? "bg-white/[0.08] text-white border border-white/[0.15] focus:border-purple-400 placeholder-gray-500"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 placeholder-gray-400"
                    }`}
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
                    className={`w-full text-sm px-3 py-2 pr-9 rounded-lg outline-none ${
                      isGlass
                        ? "bg-white/[0.08] text-white border border-white/[0.15] focus:border-purple-400 placeholder-gray-500"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 placeholder-gray-400"
                    }`}
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
                  className={`w-full text-sm px-3 py-2 rounded-lg outline-none ${
                    isGlass
                      ? "bg-white/[0.08] text-white border border-white/[0.15] focus:border-purple-400 placeholder-gray-500"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 placeholder-gray-400"
                  }`}
                />
                {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
                {passwordSuccess && <p className={`text-xs ${isGlass ? "text-green-400" : "text-green-600"}`}>Password updated!</p>}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSavePassword}
                    disabled={passwordSaving}
                    className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors ${
                      isGlass
                        ? "bg-purple-500 hover:bg-purple-600 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {passwordSaving ? "Saving..." : "Update Password"}
                  </button>
                  <button
                    onClick={() => { setShowPasswordForm(false); setPasswordError(""); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}
                    className={`text-xs px-3 py-2 rounded-lg transition-colors ${
                      isGlass ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-white"
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className={`mt-5 pt-5 border-t ${border}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-sm font-medium ${isGlass ? "text-red-300" : "text-red-600 dark:text-red-400"}`}>Reset All Progress</span>
                <p className={`text-xs mt-0.5 ${textMuted}`}>Delete all submissions and saved workspaces. This cannot be undone.</p>
              </div>
              {resetConfirm === "all" ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResetProgress(null)}
                    disabled={resetting}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    {resetting ? "Resetting..." : "Confirm Reset"}
                  </button>
                  <button
                    onClick={() => setResetConfirm(null)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      isGlass ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-white"
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setResetConfirm("all")}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors border ${
                    isGlass
                      ? "text-red-300 hover:text-red-200 hover:bg-red-500/10 border-red-500/20"
                      : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800/40"
                  }`}
                >
                  Reset All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stage Progress */}
        <section>
          <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Stage Progress</h2>
          <div className="space-y-6">
            {Object.entries(groupedByPart).map(([partNum, stages]) => (
              <div key={partNum}>
                <h3 className={`text-sm font-medium mb-3 ${textMuted}`}>
                  Part {partNum}: {PART_NAMES[partNum]}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {stages.map((stage) => {
                    const best = bestByStage[stage.slug];
                    const status = best?.status || "none";
                    const isConfirmingReset = resetConfirm === stage.slug;
                    return (
                      <div key={stage.slug} className={`${cardCls} p-3 hover:scale-[1.02] transition-transform group/card relative`}>
                        <Link href={`/stages/${stage.slug}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-mono ${textMuted}`}>
                              P{stage.part}.{stage.num}
                            </span>
                            {status === "passed" && (
                              <span className={`text-xs ${isGlass ? "text-green-400" : "text-green-500"}`}>✓</span>
                            )}
                            {status === "failed" && (
                              <span className={`text-xs ${isGlass ? "text-red-400" : "text-red-500"}`}>✗</span>
                            )}
                          </div>
                          <div className={`text-xs font-medium truncate ${textPrimary}`}>
                            {stage.name}
                          </div>
                          <StatusBadge status={status} isGlass={isGlass} />
                        </Link>
                        {status !== "none" && (
                          isConfirmingReset ? (
                            <div className="absolute inset-0 rounded-xl flex items-center justify-center gap-1.5 bg-black/60 backdrop-blur-sm z-10">
                              <button
                                onClick={() => handleResetProgress(stage.slug)}
                                disabled={resetting}
                                className="text-[10px] px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-medium"
                              >
                                {resetting ? "..." : "Reset"}
                              </button>
                              <button
                                onClick={() => setResetConfirm(null)}
                                className="text-[10px] px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white font-medium"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setResetConfirm(stage.slug)}
                              className={`absolute top-1.5 right-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity p-1 rounded-md text-[10px] ${
                                isGlass
                                  ? "text-gray-400 hover:text-red-300 hover:bg-white/[0.08]"
                                  : "text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                              }`}
                              title="Reset stage progress"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Submission History */}
        <section>
          <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Submission History</h2>
          {fetching ? (
            <div className={`${cardCls} p-8 text-center`}>
              <p className={`text-sm ${textMuted}`}>Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className={`${cardCls} p-8 text-center`}>
              <p className={`text-sm ${textMuted}`}>No submissions yet. Start a tutorial stage to begin!</p>
            </div>
          ) : (
            <div className={`${cardCls} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${border}`}>
                      {["Stage", "Language", "Status", "Tests", "Date"].map((h) => (
                        <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textMuted}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isGlass ? "divide-white/[0.06]" : "divide-gray-100 dark:divide-gray-800"}`}>
                    {submissions.map((sub) => {
                      const isExpanded = expandedId === sub.id;
                      const detail = testDetails[sub.id];
                      return (
                        <React.Fragment key={sub.id}>
                          <tr
                            className={`cursor-pointer transition-colors ${
                              isGlass
                                ? "hover:bg-white/[0.04]"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            } ${isExpanded ? (isGlass ? "bg-white/[0.04]" : "bg-gray-50 dark:bg-gray-800/50") : ""}`}
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
                            <td className="px-4 py-3">
                              <Link
                                href={`/stages/${sub.stage_slug}`}
                                className={`text-sm font-medium ${
                                  isGlass ? "text-purple-300 hover:text-purple-200" : "text-blue-600 dark:text-blue-400 hover:underline"
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {sub.stage_slug}
                              </Link>
                            </td>
                            <td className={`px-4 py-3 text-sm ${isGlass ? "text-gray-300" : "text-gray-700 dark:text-gray-300"}`}>
                              {sub.language_slug}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={sub.status} isGlass={isGlass} />
                            </td>
                            <td className={`px-4 py-3 text-sm ${isGlass ? "text-gray-300" : "text-gray-700 dark:text-gray-300"}`}>
                              {sub.test_run
                                ? `${sub.test_run.total_passed} / ${sub.test_run.total_passed + sub.test_run.total_failed}`
                                : "—"}
                            </td>
                            <td className={`px-4 py-3 text-sm ${textMuted}`}>
                              {new Date(sub.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={5} className={`px-4 py-4 ${
                                isGlass ? "bg-white/[0.03]" : "bg-gray-50 dark:bg-gray-800/30"
                              }`}>
                                {!detail ? (
                                  <p className={`text-sm text-center ${textMuted}`}>Loading test results...</p>
                                ) : !detail.test_run ? (
                                  <p className={`text-sm text-center ${textMuted}`}>No test results available.</p>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                      <span className={`text-sm font-medium ${isGlass ? "text-green-300" : "text-green-600 dark:text-green-400"}`}>
                                        {detail.test_run.total_passed} passed
                                      </span>
                                      <span className={`text-sm font-medium ${isGlass ? "text-red-300" : "text-red-600 dark:text-red-400"}`}>
                                        {detail.test_run.total_failed} failed
                                      </span>
                                      {detail.test_run.duration_ms != null && (
                                        <span className={`text-sm ${textMuted}`}>{detail.test_run.duration_ms}ms</span>
                                      )}
                                    </div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className={`border-b ${border}`}>
                                            <th className={`py-1.5 pr-2 text-left ${textMuted}`}></th>
                                            <th className={`py-1.5 pr-2 text-left ${textMuted}`}>Test</th>
                                            <th className={`py-1.5 pr-2 text-left ${textMuted}`}>Expected</th>
                                            <th className={`py-1.5 text-left ${textMuted}`}>Actual</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {detail.test_run.test_cases.map((tc, i) => (
                                            <tr key={i} className={`border-b last:border-0 ${isGlass ? "border-white/[0.04]" : "border-gray-100 dark:border-gray-800"}`}>
                                              <td className={`py-1.5 pr-2 ${tc.passed ? (isGlass ? "text-green-400" : "text-green-500") : (isGlass ? "text-red-400" : "text-red-500")}`}>
                                                {tc.passed ? "✓" : "✗"}
                                              </td>
                                              <td className={`py-1.5 pr-2 ${isGlass ? "text-gray-200" : "text-gray-700 dark:text-gray-300"}`}>
                                                {tc.name}
                                              </td>
                                              <td className="py-1.5 pr-2">
                                                <code className={`text-xs ${textMuted}`}>{tc.expected || "—"}</code>
                                              </td>
                                              <td className="py-1.5">
                                                <code className={`text-xs ${tc.passed ? textMuted : (isGlass ? "text-red-300" : "text-red-600 dark:text-red-400")}`}>
                                                  {tc.actual || "—"}
                                                </code>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
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
            </div>
          )}
        </section>
      </div>
    </GlassShell>
  );
}
