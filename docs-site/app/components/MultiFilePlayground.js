"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 32, color: "#8888a8", fontFamily: "var(--font-mono)", fontSize: 13 }}>
      Loading editor...
    </div>
  ),
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
  const pollRef = useRef(null);

  const apiSlug = stageSlug;
  const stageLabel = stageSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    setIsLoadingTemplate(true);
    setTemplateError(null);
    setFilesMap({});
    setActiveFile("");
    setTestResults(null);
    setShowResultsPanel(false);

    fetch(`${API_BASE}/api/v1/stages/${apiSlug}/template?language=${activeLang}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.files && Object.keys(data.files).length > 0) {
          setFilesMap(data.files);
          setActiveFile(Object.keys(data.files)[0]);
        } else {
          throw new Error("No files returned in starter template response.");
        }
        setIsLoadingTemplate(false);
      })
      .catch((err) => {
        console.error("Failed to load starter template from API:", err);
        setTemplateError(err.message || "Failed to connect to backend API.");
        setIsLoadingTemplate(false);
      });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [apiSlug, activeLang]);

  const handleFileContentChange = (newContent) => {
    setFilesMap((prev) => ({ ...prev, [activeFile]: newContent }));
  };

  const submitCode = async () => {
    setIsSubmitting(true);
    setTestResults(null);
    setShowResultsPanel(false);
    setProgressPhase("submitting");

    try {
      const response = await fetch(`${API_BASE}/api/v1/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setProgressPhase("compiling");

      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch(`${API_BASE}/api/v1/submissions/${data.id}`);
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
        }
      }, 1500);
    } catch (err) {
      console.error("Submission error:", err);
      setIsSubmitting(false);
      setProgressPhase(null);
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
      {isSubmitting && progressPhase && <ProgressSteps phase={progressPhase} />}

      {/* Main workspace */}
      <div className={`pg-workspace ${showResultsPanel ? "has-results" : ""}`}>
        {/* File sidebar */}
        <div className={`pg-sidebar ${showMobileSidebar ? "mobile-open" : ""}`}>
          <div className="pg-sidebar-header">
            <span>EXPLORER</span>
            <span className="pg-file-count">{fileList.length}</span>
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
                <button
                  key={filename}
                  onClick={() => {
                    setActiveFile(filename);
                    setShowMobileSidebar(false);
                  }}
                  className={`pg-file-item ${activeFile === filename ? "active" : ""}`}
                >
                  <span className="pg-file-icon">{getFileIcon(filename)}</span>
                  <span className="pg-file-name">{filename}</span>
                </button>
              ))}
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
        {showResultsPanel && testResults && (
          <div className="pg-results-panel">
            <div className="pg-results-header">
              <h3>Test Results</h3>
              {testResults.total_failed === 0 ? (
                <span className="pg-badge-pass">
                  {testResults.total_passed}/{testResults.total_passed} PASS
                </span>
              ) : (
                <span className="pg-badge-fail">
                  {testResults.total_passed}/{testResults.total_passed + testResults.total_failed} PASS
                </span>
              )}
            </div>

            <div className="pg-results-meta">
              <span>Duration: {testResults.duration_ms}ms</span>
              <span>Target: {activeLang}-droid</span>
            </div>

            {testResults.compile_logs && (
              <div className="pg-build-logs">
                <label>BUILD OUTPUT</label>
                <pre>{testResults.compile_logs}</pre>
              </div>
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
                        {!tc.passed ? "✕" : "✓"}
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
                          <div>
                            <label>INPUT</label>
                            <pre>{tc.input}</pre>
                          </div>
                          <div>
                            <label>EXPECTED</label>
                            <pre>{tc.expected}</pre>
                          </div>
                          <div>
                            <label>ACTUAL</label>
                            <pre className={!tc.passed ? "fail" : "pass"}>
                              {tc.actual}
                            </pre>
                          </div>
                        </div>
                        <div className="pg-test-exit">
                          Exit Code: <code>{tc.exit_code}</code>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mobile sidebar overlay */}
      {showMobileSidebar && (
        <div className="pg-sidebar-overlay" onClick={() => setShowMobileSidebar(false)} />
      )}
    </div>
  );
}
