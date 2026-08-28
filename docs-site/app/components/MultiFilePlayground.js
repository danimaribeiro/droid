"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "./AuthContext";
import AuthModal from "./AuthModal";

const Editor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 32, color: "#8888a8", fontFamily: "var(--font-mono)", fontSize: 13 }}>
      Loading editor...
    </div>
  ),
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const LANG_EXT = { c: ".c", cpp: ".cpp", rust: ".rs", zig: ".zig" };
const LANG_PREFIX = { c: "c-droid", cpp: "cpp-droid", rust: "rust-droid", zig: "zig-droid" };

const PROGRESS_PHASES = [
  { key: "submitting", label: "Submitting" },
  { key: "compiling", label: "Compiling" },
  { key: "testing", label: "Running Tests" },
  { key: "done", label: "Done" },
];

function getMonacoLanguage(filename) {
  if (filename.endsWith(".c") || filename.endsWith(".h")) return "c";
  if (filename.endsWith(".cpp") || filename.endsWith(".hpp")) return "cpp";
  if (filename.endsWith(".rs")) return "rust";
  if (filename.endsWith(".zig")) return "c";
  if (filename.endsWith(".toml")) return "toml";
  return "plaintext";
}

function getFileIcon(filename) {
  if (filename.endsWith(".c") || filename.endsWith(".cpp")) return "\u{1F4C4}";
  if (filename.endsWith(".h") || filename.endsWith(".hpp")) return "\u{1F4D1}";
  if (filename.endsWith(".rs")) return "\u{1F980}";
  return "⚡";
}

function handleEditorWillMount(monaco) {
  monaco.editor.defineTheme("droid-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "5a5a72", fontStyle: "italic" },
      { token: "keyword", foreground: "8b5cf6" },
      { token: "keyword.control", foreground: "8b5cf6" },
      { token: "keyword.operator", foreground: "a78bfa" },
      { token: "string", foreground: "10b981" },
      { token: "string.escape", foreground: "34d399" },
      { token: "number", foreground: "f59e0b" },
      { token: "type", foreground: "06b6d4" },
      { token: "type.identifier", foreground: "06b6d4" },
      { token: "function", foreground: "818cf8" },
      { token: "variable", foreground: "e8e8f0" },
      { token: "constant", foreground: "f59e0b" },
      { token: "operator", foreground: "a78bfa" },
      { token: "delimiter", foreground: "8888a8" },
      { token: "delimiter.bracket", foreground: "8888a8" },
      { token: "tag", foreground: "ef4444" },
      { token: "attribute.name", foreground: "06b6d4" },
      { token: "attribute.value", foreground: "10b981" },
      { token: "meta.preprocessor", foreground: "ef4444" },
      { token: "annotation", foreground: "f59e0b" },
    ],
    colors: {
      "editor.background": "#0d0d14",
      "editor.foreground": "#e8e8f0",
      "editor.lineHighlightBackground": "#16161f",
      "editor.selectionBackground": "#6366f126",
      "editor.inactiveSelectionBackground": "#6366f115",
      "editorCursor.foreground": "#6366f1",
      "editorLineNumber.foreground": "#5a5a72",
      "editorLineNumber.activeForeground": "#8888a8",
      "editorIndentGuide.background": "#1e1e2e",
      "editorIndentGuide.activeBackground": "#2e2e42",
      "editorBracketMatch.background": "#6366f120",
      "editorBracketMatch.border": "#6366f150",
      "editor.wordHighlightBackground": "#6366f115",
      "editorWhitespace.foreground": "#1e1e2e",
      "editorWidget.background": "#12121a",
      "editorWidget.border": "#1e1e2e",
      "editorSuggestWidget.background": "#12121a",
      "editorSuggestWidget.border": "#1e1e2e",
      "editorSuggestWidget.selectedBackground": "#6366f126",
      "editorHoverWidget.background": "#12121a",
      "editorHoverWidget.border": "#1e1e2e",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#5a5a7230",
      "scrollbarSlider.hoverBackground": "#5a5a7250",
      "scrollbarSlider.activeBackground": "#6366f150",
      "minimap.background": "#0d0d14",
    },
  });
}

function ProgressSteps({ phase }) {
  const currentIdx = PROGRESS_PHASES.findIndex((p) => p.key === phase);
  return (
    <div className="progress-steps">
      <div className="progress-steps-track">
        {PROGRESS_PHASES.map((p, i) => (
          <div key={p.key} className="progress-step-item">
            <div
              className={`progress-dot ${
                i < currentIdx ? "completed" : i === currentIdx ? "active" : ""
              }`}
            >
              {i < currentIdx ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            <span className={`progress-label ${i <= currentIdx ? "active" : ""}`}>
              {p.label}
            </span>
            {i < PROGRESS_PHASES.length - 1 && (
              <div className={`progress-connector ${i < currentIdx ? "completed" : ""}`} />
            )}
          </div>
        ))}
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${((currentIdx + 1) / PROGRESS_PHASES.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function MultiFilePlayground({ stageSlug }) {
  const [activeLang, setActiveLang] = useState("c");
  const [filesMap, setFilesMap] = useState({});
  const [activeFile, setActiveFile] = useState("");
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [templateError, setTemplateError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [expandedCase, setExpandedCase] = useState(null);
  const [progressPhase, setProgressPhase] = useState(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showResultsPanel, setShowResultsPanel] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [progressFading, setProgressFading] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [saveStatus, setSaveStatus] = useState(null);
  const [hasWorkspace, setHasWorkspace] = useState(false);
  const pollRef = useRef(null);
  const progressTimerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const filesMapRef = useRef(filesMap);
  const newFileInputRef = useRef(null);
  const { user, token } = useAuth();

  const apiSlug = stageSlug;
  const stageLabel = stageSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  filesMapRef.current = filesMap;

  const saveWorkspace = useCallback(async (files) => {
    if (!token) return;
    setSaveStatus("saving");
    try {
      await fetch(`${API_BASE}/api/v1/workspaces/${apiSlug}/${activeLang}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workspace: { code_files: files || filesMapRef.current } }),
      });
      setHasWorkspace(true);
      setSaveStatus("saved");
    } catch {
      setSaveStatus(null);
    }
  }, [token, apiSlug, activeLang]);

  const resetToTemplate = useCallback(async () => {
    if (!token) return;
    await fetch(`${API_BASE}/api/v1/workspaces/${apiSlug}/${activeLang}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setHasWorkspace(false);
    setSaveStatus(null);
    setIsLoadingTemplate(true);
    const res = await fetch(`${API_BASE}/api/v1/stages/${apiSlug}/template?language=${activeLang}`);
    const data = await res.json();
    if (data?.files && Object.keys(data.files).length > 0) {
      setFilesMap(data.files);
      setActiveFile(Object.keys(data.files)[0]);
    }
    setIsLoadingTemplate(false);
  }, [token, apiSlug, activeLang]);

  useEffect(() => {
    setIsLoadingTemplate(true);
    setTemplateError(null);
    setFilesMap({});
    setActiveFile("");
    setTestResults(null);
    setShowResultsPanel(false);
    setHasWorkspace(false);
    setSaveStatus(null);
    setIsCreatingFile(false);

    fetch(`${API_BASE}/api/v1/stages/${apiSlug}/template?language=${activeLang}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(async (data) => {
        if (!data?.files || Object.keys(data.files).length === 0) {
          throw new Error("No files returned in starter template response.");
        }

        if (token) {
          try {
            const wsRes = await fetch(`${API_BASE}/api/v1/workspaces/${apiSlug}/${activeLang}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (wsRes.ok) {
              const wsData = await wsRes.json();
              if (wsData.code_files && Object.keys(wsData.code_files).length > 0) {
                setFilesMap(wsData.code_files);
                setActiveFile(Object.keys(wsData.code_files)[0]);
                setHasWorkspace(true);
                setSaveStatus("saved");
                setIsLoadingTemplate(false);
                return;
              }
            }
          } catch {}
        }

        setFilesMap(data.files);
        setActiveFile(Object.keys(data.files)[0]);
        setIsLoadingTemplate(false);
      })
      .catch((err) => {
        console.error("Failed to load starter template from API:", err);
        setTemplateError(err.message || "Failed to connect to backend API.");
        setIsLoadingTemplate(false);
      });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [apiSlug, activeLang, token]);

  useEffect(() => {
    if (!hasWorkspace || isLoadingTemplate) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      saveWorkspace();
    }, 2000);
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [filesMap, hasWorkspace, isLoadingTemplate, saveWorkspace]);

  const handleFileContentChange = (newContent) => {
    setFilesMap((prev) => ({ ...prev, [activeFile]: newContent }));
  };

  const handleCreateFile = () => {
    const prefix = LANG_PREFIX[activeLang];
    setNewFileName(`${prefix}/`);
    setIsCreatingFile(true);
    setTimeout(() => newFileInputRef.current?.focus(), 50);
  };

  const confirmCreateFile = () => {
    const name = newFileName.trim();
    if (!name || filesMap.hasOwnProperty(name)) {
      setIsCreatingFile(false);
      return;
    }
    const newFiles = { [name]: "" };

    if (name.endsWith(".c") || name.endsWith(".cpp")) {
      const headerExt = name.endsWith(".cpp") ? ".hpp" : ".h";
      const headerName = name.replace(/\.(c|cpp)$/, headerExt);
      if (!filesMap.hasOwnProperty(headerName)) {
        const baseName = headerName.split("/").pop();
        const guard = baseName.replace(/\./g, "_").toUpperCase();
        newFiles[headerName] = `#ifndef ${guard}\n#define ${guard}\n\n/* Add function declarations here */\n\n#endif\n`;
      }
    } else if (name.endsWith(".h") || name.endsWith(".hpp")) {
      const sourceExt = name.endsWith(".hpp") ? ".cpp" : ".c";
      const sourceName = name.replace(/\.(h|hpp)$/, sourceExt);
      if (!filesMap.hasOwnProperty(sourceName)) {
        const headerFile = name.split("/").pop();
        newFiles[sourceName] = `#include "${headerFile}"\n`;
      }
      if (!newFiles[name]) {
        const baseName = name.split("/").pop();
        const guard = baseName.replace(/\./g, "_").toUpperCase();
        newFiles[name] = `#ifndef ${guard}\n#define ${guard}\n\n/* Add function declarations here */\n\n#endif\n`;
      }
    }

    setFilesMap((prev) => ({ ...prev, ...newFiles }));
    setActiveFile(name);
    setIsCreatingFile(false);
    setNewFileName("");
  };

  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const handleDeleteFile = (filename) => {
    if (confirmingDelete === filename) {
      setFilesMap((prev) => {
        const next = { ...prev };
        delete next[filename];
        if (activeFile === filename) {
          const remaining = Object.keys(next);
          setActiveFile(remaining[0] || "");
        }
        return next;
      });
      setConfirmingDelete(null);
    } else {
      setConfirmingDelete(filename);
    }
  };

  const submitCode = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsSubmitting(true);
    setTestResults(null);
    setShowResultsPanel(false);
    setProgressPhase("submitting");
    setProgressFading(false);
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current);

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(`${API_BASE}/api/v1/submissions`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          submission: {
            stage_slug: apiSlug,
            language_slug: activeLang,
            code_files: filesMap,
          },
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.errors ? errJson.errors.join(", ") : `HTTP ${response.status}`);
      }

      const data = await response.json();
      setHasWorkspace(true);
      setSaveStatus("saved");
      setProgressPhase("compiling");

      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch(`${API_BASE}/api/v1/submissions/${data.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const subData = await res.json();

            if (subData.status === "running") {
              setProgressPhase("testing");
            }

            if (["passed", "failed", "errored"].includes(subData.status)) {
              clearInterval(pollRef.current);
              pollRef.current = null;
              setProgressPhase("done");
              setIsSubmitting(false);
              setTestResults(subData.test_run);
              setShowResultsPanel(true);
              if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
              progressTimerRef.current = setTimeout(() => {
                setProgressFading(true);
                setTimeout(() => {
                  setProgressPhase(null);
                  setProgressFading(false);
                }, 2000);
              }, 30000);
              return;
            }
          }
        } catch (pollErr) {
          console.error("Polling error:", pollErr);
        }

        if (attempts > 30) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setIsSubmitting(false);
          setProgressPhase(null);
          setTestResults({
            total_passed: 0,
            total_failed: 0,
            duration_ms: 0,
            compile_logs: "Timed out waiting for test results. The execution may still be running — try again in a moment.",
            test_cases: [],
          });
          setShowResultsPanel(true);
        }
      }, 1500);
    } catch (err) {
      console.error("Submission error:", err);
      setIsSubmitting(false);
      setProgressPhase(null);
      setTestResults({
        total_passed: 0,
        total_failed: 0,
        duration_ms: 0,
        compile_logs: `Submission failed: ${err.message}`,
        test_cases: [],
      });
      setShowResultsPanel(true);
    }
  };

  const fileList = Object.keys(filesMap);

  return (
    <div className="pg-root">
      {/* Top bar */}
      <div className="pg-topbar">
        <div className="pg-topbar-left">
          <button
            className="pg-mobile-files-btn"
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            title="Toggle file explorer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 3h14v1.5H1V3zm0 4.25h14v1.5H1v-1.5zm0 4.25h14V13H1v-1.5z" />
            </svg>
          </button>
          <Link href="/" className="pg-topbar-brand">droid</Link>
          <span className="pg-topbar-sep">/</span>
          <Link href={`/stages/${stageSlug}`} className="pg-topbar-stage">{stageLabel}</Link>
          <span className="pg-topbar-sep">/</span>
          <span className="pg-topbar-current">Editor</span>
        </div>
        <div className="pg-topbar-right">
          {user ? (
            <Link href="/profile" className="pg-user-badge" title="View profile & progress">
              <span className="pg-user-avatar">{user.name?.[0]?.toUpperCase() || "U"}</span>
              <span className="pg-user-name">{user.name}</span>
            </Link>
          ) : (
            <button className="pg-login-btn" onClick={() => setShowAuthModal(true)}>
              Log In
            </button>
          )}
          <div className="pg-lang-switcher">
            {[
              { id: "c", label: "C" },
              { id: "cpp", label: "C++" },
              { id: "rust", label: "Rust" },
              { id: "zig", label: "Zig" },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setActiveLang(lang.id)}
                className={`pg-lang-btn ${activeLang === lang.id ? "active" : ""}`}
              >
                {lang.label}
              </button>
            ))}
          </div>
          {user && (
            <button
              className="pg-save-btn"
              onClick={() => saveWorkspace()}
              disabled={isLoadingTemplate || saveStatus === "saving"}
              title={hasWorkspace ? "Save your changes" : "Save workspace to your account"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              <span>{saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save"}</span>
            </button>
          )}
          <button
            onClick={submitCode}
            disabled={isSubmitting || isLoadingTemplate || !!templateError}
            className="pg-submit-btn"
          >
            {isSubmitting && <span className="pg-btn-spinner" />}
            {isSubmitting ? "Running..." : "Run Tests"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {progressPhase && (
        <div className={`progress-steps-wrapper ${progressFading ? "fading" : ""}`}>
          <ProgressSteps phase={progressPhase} />
        </div>
      )}

      {/* Main workspace */}
      <div className={`pg-workspace ${showResultsPanel ? "has-results" : ""}`}>
        {/* File sidebar */}
        <div className={`pg-sidebar ${showMobileSidebar ? "mobile-open" : ""}`}>
          <div className="pg-sidebar-header">
            <span>EXPLORER</span>
            <div className="pg-sidebar-actions">
              <span className="pg-file-count">{fileList.length}</span>
              <button
                className="pg-new-file-btn"
                onClick={handleCreateFile}
                title="New file"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              {hasWorkspace && (
                <button
                  className="pg-reset-btn"
                  onClick={resetToTemplate}
                  title="Reset to template"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="pg-file-list">
            {isLoadingTemplate && (
              <div style={{ padding: 16, fontSize: 12, color: "#8888a8" }}>Loading...</div>
            )}
            {templateError && (
              <div style={{ padding: 12, fontSize: 11, color: "#ef4444" }}>
                Failed to load files
              </div>
            )}
            {!isLoadingTemplate &&
              fileList.map((filename) => (
                <div
                  key={filename}
                  onClick={() => {
                    setActiveFile(filename);
                    setShowMobileSidebar(false);
                  }}
                  className={`pg-file-item ${activeFile === filename ? "active" : ""}`}
                >
                  <span className="pg-file-icon">{getFileIcon(filename)}</span>
                  <span className="pg-file-name">{filename}</span>
                  {fileList.length > 1 && confirmingDelete === filename ? (
                    <span className="pg-file-confirm">
                      <button
                        className="pg-file-confirm-yes"
                        onClick={(e) => { e.stopPropagation(); handleDeleteFile(filename); }}
                      >Delete</button>
                      <button
                        className="pg-file-confirm-no"
                        onClick={(e) => { e.stopPropagation(); setConfirmingDelete(null); }}
                      >Cancel</button>
                    </span>
                  ) : fileList.length > 1 && (
                    <button
                      className="pg-file-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(filename);
                      }}
                      title={`Delete ${filename}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            {isCreatingFile && (
              <div className="pg-new-file-row">
                <span className="pg-file-icon">{getFileIcon(`x${LANG_EXT[activeLang]}`)}</span>
                <input
                  ref={newFileInputRef}
                  className="pg-new-file-input"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmCreateFile();
                    if (e.key === "Escape") setIsCreatingFile(false);
                  }}
                  onBlur={confirmCreateFile}
                  placeholder={`${LANG_PREFIX[activeLang]}/filename${LANG_EXT[activeLang]}`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Editor pane */}
        <div className="pg-editor-pane">
          {/* File tabs */}
          <div className="pg-tabs">
            <div className="pg-tabs-scroll">
              {fileList.map((filename) => (
                <button
                  key={filename}
                  onClick={() => setActiveFile(filename)}
                  className={`pg-tab ${activeFile === filename ? "active" : ""}`}
                >
                  <span className="pg-tab-icon">{getFileIcon(filename)}</span>
                  <span>{filename}</span>
                </button>
              ))}
            </div>
            <span className="pg-tab-lang">{activeLang.toUpperCase()}</span>
          </div>

          {/* Editor */}
          <div className="pg-editor-area">
            {isLoadingTemplate ? (
              <div className="pg-editor-placeholder">Loading starter code...</div>
            ) : templateError ? (
              <div className="pg-editor-error">
                <strong>API Error:</strong> {templateError}
                <p>
                  Make sure the backend is running at <code>{API_BASE}</code> (<code>docker compose up</code>).
                </p>
              </div>
            ) : (
              <Editor
                height="100%"
                language={getMonacoLanguage(activeFile)}
                value={filesMap[activeFile] || ""}
                onChange={(value) => handleFileContentChange(value || "")}
                theme="droid-dark"
                beforeMount={handleEditorWillMount}
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 12 },
                  lineNumbers: "on",
                  renderLineHighlight: "line",
                  tabSize: 4,
                  insertSpaces: true,
                  automaticLayout: true,
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  bracketPairColorization: { enabled: true },
                }}
              />
            )}
          </div>
        </div>

        {/* Results panel (side-by-side) */}
        {showResultsPanel && testResults && (() => {
          const total = testResults.total_passed + testResults.total_failed;
          const allPassed = total > 0 && testResults.total_failed === 0;
          const isBuildFail = testResults.status === "build_failed";
          const isError = testResults.total_passed === 0 && testResults.total_failed === 0 && !isBuildFail;
          return (
          <div className="pg-results-panel">
            <div className={`pg-results-banner ${isBuildFail ? "build-fail" : allPassed ? "all-pass" : isError ? "error" : "has-fail"}`}>
              <div className="pg-results-banner-icon">
                {isBuildFail ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                ) : allPassed ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                ) : isError ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                )}
              </div>
              <div className="pg-results-banner-text">
                <span className="pg-results-banner-title">
                  {isBuildFail ? "Build Failed" : allPassed ? "All Tests Passed" : isError ? "Execution Error" : `${testResults.total_failed} Test${testResults.total_failed > 1 ? "s" : ""} Failed`}
                </span>
                <span className="pg-results-banner-sub">
                  {isBuildFail
                    ? "Your code did not compile"
                    : isError
                    ? "No test output received"
                    : `${testResults.total_passed} passed, ${testResults.total_failed} failed · ${testResults.duration_ms}ms`}
                </span>
              </div>
              {total > 0 && (
                <div className="pg-results-score">
                  <span className="pg-results-score-num">{testResults.total_passed}/{total}</span>
                </div>
              )}
            </div>

            {total > 0 && (
              <div className="pg-results-bar-track">
                <div className="pg-results-bar-fill" style={{ width: `${(testResults.total_passed / total) * 100}%` }} />
              </div>
            )}

            {testResults.status === "no_test_output" && (
              <div className="pg-error-banner">
                <strong>No test output received.</strong> Your code compiled but the test runner
                produced no results. This usually means the test harness could not be found or
                crashed before producing output.
              </div>
            )}

            {testResults.compile_logs && (
              <details className="pg-build-logs" open={isBuildFail}>
                <summary><label>BUILD OUTPUT</label></summary>
                <pre>{testResults.compile_logs}</pre>
              </details>
            )}

            <div className="pg-test-list">
              {(testResults.test_cases || []).map((tc, idx) => {
                const isOpen = expandedCase === idx || !tc.passed;
                return (
                  <div
                    key={idx}
                    className={`pg-test-item ${!tc.passed ? "fail" : "pass"}`}
                  >
                    <div
                      className="pg-test-row"
                      onClick={() => setExpandedCase(isOpen && tc.passed ? null : idx)}
                    >
                      <span className={`pg-test-icon ${!tc.passed ? "fail" : "pass"}`}>
                        {!tc.passed ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </span>
                      <span className="pg-test-name">{tc.name}</span>
                      <span className={`pg-test-badge ${!tc.passed ? "fail" : "pass"}`}>
                        {!tc.passed ? "FAIL" : "PASS"}
                      </span>
                    </div>

                    {isOpen && (
                      <div className="pg-test-detail">
                        {tc.reason && (
                          <div className="pg-test-reason">{tc.reason}</div>
                        )}
                        <div className="pg-test-diff">
                          {tc.input && (
                            <div>
                              <label>INPUT</label>
                              <pre>{tc.input}</pre>
                            </div>
                          )}
                          <div>
                            <label>EXPECTED</label>
                            <pre>{tc.expected}</pre>
                          </div>
                          <div>
                            <label>ACTUAL</label>
                            <pre className={!tc.passed ? "fail" : "pass"}>
                              {tc.actual || "(empty)"}
                            </pre>
                          </div>
                        </div>
                        {tc.exit_code != null && (
                          <div className="pg-test-exit">
                            Exit Code: <code>{tc.exit_code}</code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          );
        })()}
      </div>

      {/* Mobile sidebar overlay */}
      {showMobileSidebar && (
        <div className="pg-sidebar-overlay" onClick={() => setShowMobileSidebar(false)} />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </div>
  );
}
