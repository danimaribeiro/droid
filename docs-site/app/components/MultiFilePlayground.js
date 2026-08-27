"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function MultiFilePlayground({ stageSlug = "database/repl" }) {
  const [activeLang, setActiveLang] = useState("c");
  const [filesMap, setFilesMap] = useState({});
  const [activeFile, setActiveFile] = useState("");
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [templateError, setTemplateError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [expandedCase, setExpandedCase] = useState(null);
  const [apiStatusNote, setApiStatusNote] = useState("");

  const normalizedSlug = stageSlug === "stage1" ? "database/repl" : stageSlug;

  // Load starter files strictly from backend API
  useEffect(() => {
    setIsLoadingTemplate(true);
    setTemplateError(null);
    setFilesMap({});
    setActiveFile("");
    setTestResults(null);
    setApiStatusNote(`Fetching starter template from ${API_BASE}...`);

    fetch(`${API_BASE}/api/v1/stages/${normalizedSlug}/template?language=${activeLang}`)
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
          setApiStatusNote(`Loaded ${Object.keys(data.files).length} starter files from Rails API.`);
        } else {
          throw new Error("No files returned in starter template response.");
        }
        setIsLoadingTemplate(false);
      })
      .catch((err) => {
        console.error("Failed to load starter template from API:", err);
        setTemplateError(err.message || "Failed to connect to Rails backend API.");
        setIsLoadingTemplate(false);
        setApiStatusNote(`Error loading template from API.`);
      });
  }, [normalizedSlug, activeLang]);

  const handleFileContentChange = (newContent) => {
    setFilesMap((prev) => ({
      ...prev,
      [activeFile]: newContent
    }));
  };

  const submitCode = async () => {
    setIsSubmitting(true);
    setTestResults(null);
    setApiStatusNote("Connecting to Rails Backend & Piston Execution Engine...");

    try {
      const response = await fetch(`${API_BASE}/api/v1/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission: {
            stage_slug: normalizedSlug,
            language_slug: activeLang,
            code_files: filesMap
          }
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.errors ? errJson.errors.join(", ") : `HTTP ${response.status} Submission failed`);
      }

      const data = await response.json();
      setApiStatusNote(`Submission ${data.id} queued. Polling test results...`);

      // Poll for test run results
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch(`${API_BASE}/api/v1/submissions/${data.id}`);
          if (res.ok) {
            const subData = await res.json();
            if (subData.status === "passed" || subData.status === "failed" || subData.status === "errored") {
              clearInterval(pollInterval);
              setIsSubmitting(false);
              setTestResults(subData.test_run);
              setApiStatusNote(`Test execution complete (Status: ${subData.status}).`);
              return;
            }
          }
        } catch (pollErr) {
          console.error("Error polling submission status:", pollErr);
        }

        if (attempts > 20) {
          clearInterval(pollInterval);
          setIsSubmitting(false);
          setApiStatusNote("Execution request timed out while polling status.");
        }
      }, 1000);
    } catch (err) {
      console.error("Submission error:", err);
      setIsSubmitting(false);
      setApiStatusNote(`Submission failed: ${err.message}`);
    }
  };

  const fileList = Object.keys(filesMap);

  return (
    <div className="multi-playground-container">
      {/* Top Description Header */}
      <div className="playground-header">
        <div className="playground-breadcrumb">
          <Link href="/">Home</Link> › <Link href="/stages/stage1-repl">Stage 1</Link> › <span>Interactive Workspace</span>
        </div>
        <h1 className="playground-title">🛠️ Multi-File Code Editor & Test Runner</h1>
        <p className="playground-description">
          Edit starter code files for stage <strong>{normalizedSlug}</strong>.
          Submit your implementation to compile and run integration tests against the Piston container sandbox via the Rails API.
        </p>
      </div>

      {/* Language Selector Bar */}
      <div className="playground-lang-bar">
        {[
          { id: "c", label: "⚙️ C (c-droid)" },
          { id: "cpp", label: "🚀 C++ (cpp-droid)" },
          { id: "rust", label: "🛡️ Rust (rust-droid)" },
          { id: "zig", label: "⚡ Zig (zig-droid)" }
        ].map((lang) => (
          <button
            key={lang.id}
            onClick={() => setActiveLang(lang.id)}
            className={`lang-tab ${activeLang === lang.id ? "active" : ""}`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Main Workspace Split (Sidebar Tree + Editor) */}
      <div className="workspace-editor-card">
        {/* Left File Tree Sidebar */}
        <div className="workspace-sidebar">
          <div className="sidebar-header">
            <span>📁 WORKSPACE TREE</span>
            <span className="file-count">{fileList.length} Files</span>
          </div>
          <div className="file-tree-list">
            {isLoadingTemplate && (
              <div style={{ padding: 16, fontSize: 12, color: "#8888a8" }}>
                Loading files...
              </div>
            )}
            {templateError && (
              <div style={{ padding: 12, fontSize: 11, color: "#ef4444" }}>
                Failed to load files from API
              </div>
            )}
            {!isLoadingTemplate && fileList.map((filename) => {
              const isSelected = activeFile === filename;
              return (
                <button
                  key={filename}
                  onClick={() => setActiveFile(filename)}
                  className={`file-tree-item ${isSelected ? "active" : ""}`}
                >
                  <span className="file-icon">
                    {filename.endsWith(".c") || filename.endsWith(".cpp") ? "📄" : filename.endsWith(".h") || filename.endsWith(".hpp") ? "📑" : filename.endsWith(".rs") ? "🦀" : "⚡"}
                  </span>
                  <span className="file-name">{filename}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Code Editor View */}
        <div className="workspace-editor-main">
          <div className="editor-tab-bar">
            <span className="active-tab-title">{activeFile ? `📄 ${activeFile}` : "No file selected"}</span>
            <span className="editor-lang-tag">{activeLang.toUpperCase()}</span>
          </div>

          {isLoadingTemplate ? (
            <div style={{ padding: 32, color: "#8888a8", fontFamily: "var(--font-mono)", fontSize: 13 }}>
              Loading starter code template from Rails API...
            </div>
          ) : templateError ? (
            <div style={{ padding: 24, color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", margin: 16, borderRadius: 8 }}>
              <strong>API Error:</strong> {templateError}
              <p style={{ marginTop: 8, fontSize: 12, color: "#cbd5e1" }}>
                Make sure the Rails API server is running at <code>{API_BASE}</code> (run <code>bin/rails server</code> inside <code>backend/</code> or <code>docker compose up</code>).
              </p>
            </div>
          ) : (
            <textarea
              value={filesMap[activeFile] || ""}
              onChange={(e) => handleFileContentChange(e.target.value)}
              className="code-textarea"
              rows={18}
              spellCheck={false}
            />
          )}

          <div className="editor-footer">
            <span className="status-note">{apiStatusNote}</span>
            <button
              onClick={submitCode}
              disabled={isSubmitting || isLoadingTemplate || !!templateError}
              className="btn-submit-code"
            >
              {isSubmitting ? "⌛ Running Tests in Sandbox..." : "▶ Submit Code & Run Tests"}
            </button>
          </div>
        </div>
      </div>

      {/* Test Execution Results Area */}
      {isSubmitting && (
        <div className="test-spinner-box">
          <div className="test-spinner" />
          <span>Dispatching payload to Piston Container Sandbox via Rails API...</span>
        </div>
      )}

      {testResults && (
        <div className="test-results-container fade-in">
          <div className="results-header">
            <div className="results-summary">
              <h3>Test Harness Execution Summary</h3>
              <span className="suite-info">Duration: <code>{testResults.duration_ms}ms</code> | Target: <code>{activeLang}-droid</code></span>
            </div>
            {testResults.total_failed === 0 ? (
              <span className="badge-pass-all">🎉 ALL {testResults.total_passed} TESTS PASSED</span>
            ) : (
              <span className="badge-fail-suite">❌ SUITE FAILED ({testResults.total_passed}/{testResults.total_passed + testResults.total_failed} Pass)</span>
            )}
          </div>

          {testResults.compile_logs && (
            <div className="compile-logs-box">
              <label>COMPILATION & BUILD LOGS</label>
              <pre>{testResults.compile_logs}</pre>
            </div>
          )}

          <div className="results-list">
            {(testResults.test_cases || []).map((tc, idx) => {
              const isOpen = expandedCase === idx || !tc.passed;

              return (
                <div key={idx} className={`test-card-item ${!tc.passed ? "fail-border" : "pass-border"}`}>
                  <div
                    className="test-card-header"
                    onClick={() => setExpandedCase(isOpen ? null : idx)}
                  >
                    <div className="test-card-title-col">
                      <span className={!tc.passed ? "icon-fail" : "icon-pass"}>
                        {!tc.passed ? "✕" : "✓"}
                      </span>
                      <span className="test-bin-prefix">[{activeLang}-droid]</span>
                      <strong className="test-id-name">{tc.name}</strong>
                    </div>
                    <div className="test-status-badge">
                      {!tc.passed ? (
                        <span className="status-badge-fail">FAIL</span>
                      ) : (
                        <span className="status-badge-pass">PASS</span>
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="test-diagnostic-block">
                      {tc.reason && (
                        <div className="diagnostic-reason-box">
                          <strong>Reason:</strong> {tc.reason}
                        </div>
                      )}
                      <div className="diagnostic-grid">
                        <div>
                          <label>INPUT STREAM</label>
                          <pre className="diag-pre">{tc.input}</pre>
                        </div>
                        <div>
                          <label>EXPECTED OUTPUT</label>
                          <pre className="diag-pre">{tc.expected}</pre>
                        </div>
                        <div>
                          <label>ACTUAL OUTPUT</label>
                          <pre className={`diag-pre ${!tc.passed ? "actual-fail-text" : "actual-pass-text"}`}>
                            {tc.actual}
                          </pre>
                        </div>
                      </div>
                      <div className="diag-footer-line">
                        <span>Exit Code: <code>{tc.exit_code}</code></span>
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
  );
}
