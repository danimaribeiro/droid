"use client";

import { useState, useEffect } from "react";
import { STAGE_HARNESS_DATA } from "./stageTestHarnessData";

export default function CodeSubmitRunner({ slug }) {
  // Normalize stage slugs if necessary
  const normalizedSlug = slug === "stage4-row-serialization" ? "stage4-serialization" : slug;
  const stageData = STAGE_HARNESS_DATA[normalizedSlug];

  const [activeLang, setActiveLang] = useState("c");
  const [code, setCode] = useState(stageData?.samples?.c || "");
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [isBuggyMode, setIsBuggyMode] = useState(false);
  const [expandedCase, setExpandedCase] = useState(null);

  useEffect(() => {
    if (stageData && stageData.samples) {
      setCode(stageData.samples[activeLang] || "");
      setHasRun(false);
    }
  }, [normalizedSlug, activeLang, stageData]);

  if (!stageData) return null;

  const handleLangChange = (lang) => {
    setActiveLang(lang);
    if (stageData?.samples) {
      setCode(stageData.samples[lang] || "");
    }
  };

  const runTests = () => {
    setIsRunning(true);
    setHasRun(false);
    setTimeout(() => {
      setIsRunning(false);
      setHasRun(true);
    }, 850);
  };

  return (
    <div className="submit-runner-wrapper">
      
      {/* Implementation Guidance Header */}
      <div className="runner-header-block">
        <h2 className="runner-main-title">🛠️ Implementation & Submission Workspace</h2>
        <p className="runner-subtitle">
          {stageData.subtitle || "Build and execute integration tests in your target language."}
        </p>
        
        <div className="runner-example-box">
          {(stageData.examples || []).map((ex, idx) => (
            <div key={idx} className="example-col">
              <span className="example-badge">{ex.badge || "EXAMPLE"}</span>
              <pre className="example-terminal">{ex.terminal || ""}</pre>
            </div>
          ))}
        </div>
      </div>

      {/* Code Editor Interactive Sandbox */}
      <div className="sandbox-card">
        <div className="sandbox-top-bar">
          <div className="sandbox-tabs">
            {["c", "cpp", "rust", "zig"].map((l) => (
              <button
                key={l}
                onClick={() => handleLangChange(l)}
                className={`sandbox-tab ${activeLang === l ? "active" : ""}`}
              >
                {l === "c" && "⚙️ C (c-droid)"}
                {l === "cpp" && "🚀 C++ (cpp-droid)"}
                {l === "rust" && "🛡️ Rust (rust-droid)"}
                {l === "zig" && "⚡ Zig (zig-droid)"}
              </button>
            ))}
          </div>
          <div className="sandbox-mode-toggle">
            <label className="mode-label">Simulate Solution Quality:</label>
            <select 
              value={isBuggyMode ? "buggy" : "pass"} 
              onChange={(e) => setIsBuggyMode(e.target.value === "buggy")}
              className="mode-select"
            >
              <option value="pass">🟢 Working Submission (All Tests Pass)</option>
              <option value="buggy">🔴 Buggy Implementation Simulation</option>
            </select>
          </div>
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="sandbox-textarea"
          rows={18}
          spellCheck={false}
        />

        <div className="sandbox-footer">
          <span className="sandbox-status-note">
            ℹ️ Edits are sandboxed in browser. Click Run to verify against python integration test runner.
          </span>
          <button 
            onClick={runTests} 
            disabled={isRunning}
            className="btn-submit-test"
          >
            {isRunning ? "Running in Container..." : "▶ Submit Code & Verify Tests"}
          </button>
        </div>
      </div>

      {/* Test Runner Results Area */}
      {isRunning && (
        <div className="test-spinner-box">
          <div className="test-spinner" />
          <span>Spawning test container & mounting <code>{activeLang}-droid</code> binary against Python runner...</span>
        </div>
      )}

      {hasRun && (
        <div className="test-results-container fade-in">
          <div className="results-header">
            <div className="results-summary">
              <h3>Test Harness Execution Summary</h3>
              <span className="suite-info">Suite: <code>{stageData.suiteName}</code> | Runner: <code>{stageData.makeCmd}</code></span>
            </div>
            {!isBuggyMode ? (
              <span className="badge-pass-all">🎉 ALL {stageData.tests.length} TESTS PASSED</span>
            ) : (
              <span className="badge-fail-suite">❌ SUITE FAILED ({stageData.tests.length - 1}/{stageData.tests.length} Pass)</span>
            )}
          </div>

          <div className="results-list">
            {stageData.tests.map((test) => {
              const isFailed = isBuggyMode && test.id === stageData.brokenTestId;
              const isOpen = expandedCase === test.id || isFailed;

              return (
                <div key={test.id} className={`test-card-item ${isFailed ? "fail-border" : "pass-border"}`}>
                  
                  {/* Compact Header Line (One-Line Policy for PASS) */}
                  <div 
                    className="test-card-header" 
                    onClick={() => setExpandedCase(isOpen ? null : test.id)}
                  >
                    <div className="test-card-title-col">
                      <span className={isFailed ? "icon-fail" : "icon-pass"}>
                        {isFailed ? "✕" : "✓"}
                      </span>
                      <span className="test-bin-prefix">[{activeLang}-droid]</span>
                      <strong className="test-id-name">{test.id}</strong>
                      <span className="test-mini-header">— {test.header}</span>
                    </div>
                    <div className="test-status-badge">
                      {isFailed ? (
                        <span className="status-badge-fail">FAIL</span>
                      ) : (
                        <span className="status-badge-pass">PASS</span>
                      )}
                    </div>
                  </div>

                  {/* Diagnostic Details Block (Expanded or on Fail) */}
                  {isOpen && (
                    <div className="test-diagnostic-block">
                      {isFailed && (
                        <div className="diagnostic-reason-box">
                          <strong>Reason:</strong> {stageData.bugFailReason}
                        </div>
                      )}
                      <div className="diagnostic-grid">
                        <div>
                          <label>INPUT STREAM</label>
                          <pre className="diag-pre">{test.input}</pre>
                        </div>
                        <div>
                          <label>EXPECTED OUTPUT</label>
                          <pre className="diag-pre">{test.expected}</pre>
                        </div>
                        <div>
                          <label>ACTUAL OUTPUT</label>
                          <pre className={`diag-pre ${isFailed ? "actual-fail-text" : "actual-pass-text"}`}>
                            {isFailed ? stageData.brokenActual : test.expected}
                          </pre>
                        </div>
                      </div>
                      <div className="diag-footer-line">
                        <span>Expected Exit Code: <code>{test.exitCode}</code></span>
                        <span>Actual Exit Code: <code className={isFailed ? "code-err" : ""}>{isFailed ? (stageData.brokenCode !== undefined ? stageData.brokenCode : 1) : test.exitCode}</code></span>
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
