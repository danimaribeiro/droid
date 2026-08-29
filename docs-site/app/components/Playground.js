"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthModal from "./AuthModal";
import { Bot } from "lucide-react";
import {
  usePlaygroundLogic,
  Editor,
  handleEditorWillMount,
  getMonacoLanguage,
  getFileIcon,
  PROGRESS_PHASES,
  LANGS,
  LANG_EXT,
  LANG_PREFIX,
  TUTORIAL_STAGES,
} from "./usePlaygroundLogic";

function ProgressSteps({ phase }) {
  const currentIdx = PROGRESS_PHASES.findIndex((p) => p.key === phase);
  return (
    <div data-testid="progress-steps" className="flex flex-col items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-1">
        {PROGRESS_PHASES.map((p, i) => (
          <div key={p.key} className="flex items-center gap-1">
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium border
                ${i < currentIdx ? "bg-blue-600 border-blue-600 text-white" : ""}
                ${i === currentIdx ? "bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-700 dark:text-blue-300 animate-pulse" : ""}
                ${i > currentIdx ? "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500" : ""}
              `}
            >
              {i < currentIdx ? (
                <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            <span className={`text-xs ${i <= currentIdx ? "text-gray-800 dark:text-gray-200 font-medium" : "text-gray-400 dark:text-gray-500"}`}>
              {p.label}
            </span>
            {i < PROGRESS_PHASES.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${i < currentIdx ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
        <div
          className="bg-blue-600 h-1 rounded-full transition-all duration-500"
          style={{ width: `${((currentIdx + 1) / PROGRESS_PHASES.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function Playground({ stageSlug }) {
  const [theme, setTheme] = useState("glass");

  const {
    activeLang, setActiveLang,
    filesMap,
    activeFile, setActiveFile,
    isLoadingTemplate,
    templateError,
    isSubmitting,
    testResults,
    expandedCase, setExpandedCase,
    progressPhase,
    showMobileSidebar, setShowMobileSidebar,
    showResultsPanel,
    showAuthModal, setShowAuthModal,
    progressFading,
    isCreatingFile, setIsCreatingFile,
    newFileName, setNewFileName,
    saveStatus,
    hasWorkspace,
    confirmingDelete, setConfirmingDelete,
    newFileInputRef,
    user,
    stageLabel,
    fileList,
    saveWorkspace,
    resetToTemplate,
    handleFileContentChange,
    handleCreateFile,
    confirmCreateFile,
    handleDeleteFile,
    submitCode,
  } = usePlaygroundLogic(stageSlug);

  useEffect(() => {
    import("preline/preline").then(() => {
      window.HSStaticMethods?.autoInit();
    });
  }, []);

  useEffect(() => {
    import("preline/preline").then(() => {
      window.HSStaticMethods?.autoInit();
    });
  }, [theme]);

  const isGlass = theme === "glass";
  const isDark = theme === "dark" || isGlass || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const border = isGlass ? "border-white/[0.10]" : "border-gray-200 dark:border-gray-700";

  const content = (
    <div className={`flex flex-col overflow-hidden ${isGlass ? "flex-1 min-h-0 gap-2" : "h-screen bg-gray-50 dark:bg-gray-950"}`}>
      {/* Topbar */}
      <div data-testid="pg-topbar" className={`relative z-20 flex items-center justify-between px-4 h-14 shrink-0 ${isGlass ? "bg-white/[0.14] backdrop-blur-2xl rounded-xl border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" : `bg-white dark:bg-gray-800 border-b ${border}`}`}>
        <div className="flex items-center gap-2 min-w-0">
          <button
            className="lg:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 3h14v1.5H1V3zm0 4.25h14v1.5H1v-1.5zm0 4.25h14V13H1v-1.5z" />
            </svg>
          </button>
          <Link href="/" className={`flex items-center gap-1.5 text-sm font-bold ${isGlass ? "text-white" : "text-gray-800 dark:text-gray-200"}`}><Bot className="w-4 h-4" />droid</Link>
          <span className={isGlass ? "text-gray-500" : "text-gray-300 dark:text-gray-600"}>/</span>
          <Link href={`/stages/${stageSlug}`} data-testid="pg-topbar-stage" className={`text-sm truncate ${isGlass ? "text-gray-300 hover:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>{stageLabel}</Link>
          <span className={isGlass ? "text-gray-500" : "text-gray-300 dark:text-gray-600"}>/</span>
          <span className={`text-sm font-medium ${isGlass ? "text-white" : "text-gray-800 dark:text-gray-200"}`}>Editor</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme switcher */}
          <div className="hs-dropdown relative inline-flex">
            <button
              id="hs-dropdown-theme"
              type="button"
              className={`hs-dropdown-toggle py-1.5 px-3 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border shadow-sm ${isGlass ? "border-white/[0.15] bg-white/[0.08] text-white hover:bg-white/[0.12]" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              aria-haspopup="menu"
              aria-expanded="false"
              aria-label="Theme"
            >
              {theme === "light" ? "☀️ Light" : theme === "dark" ? "🌙 Dark" : theme === "glass" ? "✦ Glass" : "💻 System"}
              <svg className="hs-dropdown-open:rotate-180 size-3.5" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 4 4 4-4"/></svg>
            </button>
            <div
              className={`hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden min-w-40 shadow-md rounded-lg p-1 mt-2 z-50 border ${isGlass ? "bg-gray-900 border-white/[0.08]" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="hs-dropdown-theme"
            >
              {[
                { id: "light", label: "☀️ Light" },
                { id: "dark", label: "🌙 Dark" },
                { id: "system", label: "💻 System" },
                { id: "glass", label: "✦ Glass" },
              ].map((t) => (
                <button key={t.id} onClick={() => setTheme(t.id)} className={`flex items-center gap-x-2 w-full py-2 px-3 rounded-lg text-sm ${theme === t.id ? (isGlass ? "bg-white/[0.1] text-blue-400" : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400") : (isGlass ? "text-gray-100 hover:bg-white/[0.06]" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700")}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {user ? (
            <Link href="/profile" className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold">{user.name?.[0]?.toUpperCase() || "U"}</span>
              )}
              <span data-testid="pg-user-name" className={`text-xs hidden sm:inline ${isGlass ? "text-white" : "text-gray-700 dark:text-gray-300"}`}>{user.name}</span>
            </Link>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="py-1.5 px-3 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              Log In
            </button>
          )}

          {/* Language switcher */}
          <div className={`inline-flex rounded-lg border overflow-hidden ${isGlass ? "border-white/[0.15]" : "border-gray-200 dark:border-gray-700"}`}>
            {LANGS.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setActiveLang(lang.id)}
                data-testid="pg-lang-btn"
                data-active={activeLang === lang.id ? "true" : undefined}
                className={`py-1.5 px-3 text-xs font-medium transition-colors
                  ${activeLang === lang.id
                    ? "bg-blue-600 text-white"
                    : isGlass ? "bg-white/[0.05] text-gray-200 hover:bg-white/[0.1]" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {user && (
            <button
              data-testid="pg-save-btn"
              onClick={() => saveWorkspace()}
              disabled={isLoadingTemplate || saveStatus === "saving"}
              className={`py-1.5 px-3 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border shadow-sm disabled:opacity-50 ${isGlass ? "border-white/[0.15] bg-white/[0.08] text-white hover:bg-white/[0.12]" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save"}
            </button>
          )}

          <button
            data-testid="pg-submit-btn"
            onClick={submitCode}
            disabled={isSubmitting || isLoadingTemplate || !!templateError}
            className="py-1.5 px-4 inline-flex items-center gap-x-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && (
              <span className="animate-spin inline-block size-3.5 border-2 border-current border-t-transparent text-white rounded-full" />
            )}
            {isSubmitting ? "Running..." : "Run Tests"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {progressPhase && (
        <div className={progressFading ? "opacity-0 transition-opacity duration-2000" : ""}>
          <ProgressSteps phase={progressPhase} />
        </div>
      )}

      {/* Main workspace */}
      <div className="relative flex-1 min-h-0">
      <div className={`absolute inset-0 flex overflow-hidden ${isGlass ? "gap-2" : ""}`}>
        {/* Tutorial sidebar */}
        <div className={`hidden lg:flex flex-col w-52 shrink-0 overflow-y-auto ${isGlass ? "bg-white/[0.10] backdrop-blur-xl rounded-xl border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]" : `bg-white dark:bg-gray-900 border-r ${border}`}`}>
          <div className={`px-3 py-2 border-b ${isGlass ? "border-white/[0.08]" : border} flex items-center gap-2`}>
            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full ${isGlass ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"}`}>Part 1</span>
            <span className={`text-xs font-semibold ${isGlass ? "text-white" : "text-gray-700 dark:text-gray-300"}`}>Fixed-Layout DB</span>
          </div>
          <nav className="flex-1 py-1">
            {TUTORIAL_STAGES.map((group) => (
              <div key={group.section} className="mb-1">
                <div className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${isGlass ? "text-gray-400" : "text-gray-400 dark:text-gray-500"}`}>{group.section}</div>
                {group.stages.map((s) => (
                  <a
                    key={s.slug}
                    href={`/playground/${s.slug}`}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                      stageSlug === s.slug
                        ? isGlass ? "bg-white/[0.1] text-blue-300 font-medium border-r-2 border-blue-400" : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium border-r-2 border-blue-600"
                        : isGlass ? "text-gray-200 hover:bg-white/[0.06] hover:text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                      stageSlug === s.slug
                        ? "bg-blue-600 text-white"
                        : isGlass ? "bg-white/[0.08] text-gray-300" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}>{s.num}</span>
                    {s.title}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* File sidebar */}
        <div data-testid="pg-sidebar" className={`${showMobileSidebar ? "fixed inset-y-0 left-0 z-40 w-64" : "hidden lg:flex"} flex-col w-56 shrink-0 ${isGlass ? "bg-white/[0.10] backdrop-blur-xl rounded-xl border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]" : `bg-gray-50 dark:bg-gray-900 border-r ${border}`}`}>
          <div className={`flex items-center justify-between px-3 py-2 border-b ${isGlass ? "border-white/[0.08]" : border}`}>
            <span className={`text-[10px] font-semibold tracking-wider uppercase ${isGlass ? "text-gray-300" : "text-gray-400 dark:text-gray-500"}`}>Explorer</span>
            <div className="flex items-center gap-1">
              <span className={`text-[10px] rounded px-1.5 py-0.5 ${isGlass ? "text-gray-300 bg-white/[0.10]" : "text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700"}`}>{fileList.length}</span>
              <button data-testid="pg-new-file-btn" onClick={handleCreateFile} className={`p-1 rounded ${isGlass ? "hover:bg-white/[0.10] text-gray-300" : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"}`} title="New file">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              {hasWorkspace && (
                <button data-testid="pg-reset-btn" onClick={resetToTemplate} className={`p-1 rounded ${isGlass ? "hover:bg-white/[0.10] text-gray-300" : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"}`} title="Reset to template">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {isLoadingTemplate && (
              <div className="px-3 py-4 text-xs text-gray-400 dark:text-gray-500">Loading...</div>
            )}
            {templateError && (
              <div className="px-3 py-2 text-xs text-red-500">Failed to load files</div>
            )}
            {!isLoadingTemplate && fileList.map((filename) => (
              <div
                key={filename}
                data-testid="pg-file-item"
                onClick={() => { setActiveFile(filename); setShowMobileSidebar(false); }}
                className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs
                  ${activeFile === filename
                    ? isGlass ? "bg-white/[0.1] text-white font-medium" : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                    : isGlass ? "text-gray-200 hover:bg-white/[0.06] hover:text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
              >
                {getFileIcon(filename)}
                <span className="truncate flex-1">{filename}</span>
                {fileList.length > 1 && confirmingDelete === filename ? (
                  <span className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(filename); }} className="text-[10px] text-red-600 dark:text-red-400 font-medium hover:underline">Delete</button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmingDelete(null); }} className="text-[10px] text-gray-500 hover:underline">Cancel</button>
                  </span>
                ) : fileList.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(filename); }}
                    className="hidden group-hover:block p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400"
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
              <div className="flex items-center gap-2 px-3 py-1.5">
                {getFileIcon(`x${LANG_EXT[activeLang]}`)}
                <input
                  ref={newFileInputRef}
                  data-testid="pg-new-file-input"
                  className="flex-1 text-xs bg-white dark:bg-gray-800 border border-blue-400 dark:border-blue-500 rounded px-2 py-1 outline-none text-gray-800 dark:text-gray-200"
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
        <div data-testid="pg-editor-pane" className={`flex flex-col flex-1 min-w-0 ${isGlass ? "rounded-xl border border-white/[0.12] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]" : ""}`}>
          {/* File tabs */}
          <div className={`flex items-center border-b ${isGlass ? "border-white/[0.10] bg-white/[0.12] backdrop-blur-xl" : `${border} bg-gray-100 dark:bg-gray-900`}`}>
            <div className="flex-1 flex overflow-x-auto">
              {fileList.map((filename) => (
                <button
                  key={filename}
                  data-testid="pg-tab"
                  data-active={activeFile === filename ? "true" : undefined}
                  onClick={() => setActiveFile(filename)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap border-r ${isGlass ? "border-white/[0.08]" : border}
                    ${activeFile === filename
                      ? isGlass ? "bg-white/[0.08] text-white font-medium" : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
                      : isGlass ? "text-gray-300 hover:bg-white/[0.06] hover:text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                >
                  {getFileIcon(filename)}
                  {filename}
                </button>
              ))}
            </div>
            <span className={`px-3 text-[10px] font-semibold tracking-wider uppercase ${isGlass ? "text-gray-400" : "text-gray-400 dark:text-gray-500"}`}>{activeLang}</span>
          </div>

          {/* Editor area */}
          <div className="flex-1 min-h-0">
            {isLoadingTemplate ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500">Loading starter code...</div>
            ) : templateError ? (
              <div className="p-6 text-sm text-red-500">
                <strong>API Error:</strong> {templateError}
                <p className="mt-2 text-gray-500 dark:text-gray-400">Make sure the backend is running at <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}</code></p>
              </div>
            ) : (
              <Editor
                height="100%"
                language={getMonacoLanguage(activeFile)}
                value={filesMap[activeFile] || ""}
                onChange={(value) => handleFileContentChange(value || "")}
                theme={isDark ? "droid-dark" : "droid-light"}
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

        {/* Results panel */}
        {showResultsPanel && testResults && (() => {
          const total = testResults.total_passed + testResults.total_failed;
          const allPassed = total > 0 && testResults.total_failed === 0;
          const isBuildFail = testResults.status === "build_failed";
          const isError = testResults.total_passed === 0 && testResults.total_failed === 0 && !isBuildFail;
          return (
            <div data-testid="pg-results-panel" className={`w-80 lg:w-96 h-full flex flex-col shrink-0 overflow-hidden ${isGlass ? "bg-white/[0.12] backdrop-blur-xl rounded-xl border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]" : `bg-white dark:bg-gray-800 border-l ${border}`}`}>
              {/* Banner */}
              <div data-testid="pg-results-banner" className={`shrink-0 flex items-center gap-3 p-4 border-b
                ${isBuildFail ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : ""}
                ${allPassed ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : ""}
                ${isError ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" : ""}
                ${!isBuildFail && !allPassed && !isError ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : ""}
              `}>
                <div className={`shrink-0
                  ${isBuildFail || (!allPassed && !isError) ? "text-red-500" : ""}
                  ${allPassed ? "text-green-500" : ""}
                  ${isError ? "text-yellow-500" : ""}
                `}>
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
                <div className="flex-1 min-w-0">
                  <div data-testid="pg-results-banner-title" className={`font-semibold text-sm
                    ${isBuildFail || (!allPassed && !isError) ? "text-red-700 dark:text-red-300" : ""}
                    ${allPassed ? "text-green-700 dark:text-green-300" : ""}
                    ${isError ? "text-yellow-700 dark:text-yellow-300" : ""}
                  `}>
                    {isBuildFail ? "Build Failed" : allPassed ? "All Tests Passed" : isError ? "Execution Error" : `${testResults.total_failed} Test${testResults.total_failed > 1 ? "s" : ""} Failed`}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isBuildFail
                      ? "Your code did not compile"
                      : isError
                      ? "No test output received"
                      : `${testResults.total_passed} passed, ${testResults.total_failed} failed · ${testResults.duration_ms}ms`}
                  </div>
                </div>
                {total > 0 && (
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300 shrink-0">{testResults.total_passed}/{total}</span>
                )}
              </div>

              {/* Progress bar */}
              {total > 0 && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1">
                  <div className="bg-green-500 h-1 transition-all duration-300" style={{ width: `${(testResults.total_passed / total) * 100}%` }} />
                </div>
              )}

              {testResults.status === "no_test_output" && (
                <div data-testid="pg-error-banner" className="mx-3 mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs text-yellow-800 dark:text-yellow-300">
                  <strong>No test output received.</strong> Your code compiled but the test runner produced no results.
                </div>
              )}

              {/* Build logs */}
              {testResults.compile_logs && (
                <details className="mx-3 mt-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden" open={isBuildFail}>
                  <summary className="px-3 py-2 text-[10px] font-semibold tracking-wider text-gray-400 dark:text-gray-500 uppercase cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                    Build Output
                  </summary>
                  <pre className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 overflow-x-auto whitespace-pre-wrap font-mono">{testResults.compile_logs}</pre>
                </details>
              )}

              {/* Test cases */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                {(testResults.test_cases || []).map((tc, idx) => {
                  const isOpen = expandedCase === idx || !tc.passed;
                  return (
                    <div key={idx} data-testid="pg-test-item" data-status={!tc.passed ? "fail" : "pass"} className={`border rounded-lg overflow-hidden ${!tc.passed ? "border-red-200 dark:border-red-800" : "border-gray-200 dark:border-gray-700"}`}>
                      <div
                        onClick={() => setExpandedCase(isOpen && tc.passed ? null : idx)}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer
                          ${!tc.passed ? "bg-red-50 dark:bg-red-900/20" : "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"}`}
                      >
                        <span className={`shrink-0 ${!tc.passed ? "text-red-500" : "text-green-500"}`}>
                          {!tc.passed ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </span>
                        <span className="text-xs text-gray-800 dark:text-gray-200 flex-1 truncate">{tc.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${!tc.passed ? "bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200" : "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200"}`}>
                          {!tc.passed ? "FAIL" : "PASS"}
                        </span>
                      </div>
                      {isOpen && (
                        <div data-testid="pg-test-detail" className="px-3 py-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 space-y-2">
                          {tc.reason && (
                            <div className="text-xs text-red-600 dark:text-red-400">{tc.reason}</div>
                          )}
                          <div className="space-y-2">
                            {tc.input && (
                              <div>
                                <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">Input</div>
                                <pre className="text-xs bg-gray-50 dark:bg-gray-900 rounded p-2 overflow-x-auto font-mono text-gray-700 dark:text-gray-300">{tc.input}</pre>
                              </div>
                            )}
                            <div>
                              <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">Expected</div>
                              <pre className="text-xs bg-gray-50 dark:bg-gray-900 rounded p-2 overflow-x-auto font-mono text-gray-700 dark:text-gray-300">{tc.expected}</pre>
                            </div>
                            <div>
                              <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">Actual</div>
                              <pre className={`text-xs rounded p-2 overflow-x-auto font-mono ${!tc.passed ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300" : "bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300"}`}>
                                {tc.actual || "(empty)"}
                              </pre>
                            </div>
                          </div>
                          {tc.exit_code != null && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Exit Code: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{tc.exit_code}</code>
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
      </div>

      {/* Mobile sidebar overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-30 bg-black/30" onClick={() => setShowMobileSidebar(false)} />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </div>
  );

  if (isGlass) {
    return (
      <div
        className="dark h-screen flex flex-col p-3 overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #3d1f5c 0%, #2a1445 25%, #1a0e30 50%, #1a1030 75%, #2d1248 100%)" }}
      >
        <div
          className="absolute top-[-20%] left-[-15%] w-[65%] h-[75%] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(230,100,140,0.25) 0%, transparent 55%)" }}
        />
        <div
          className="absolute top-[-15%] right-[-10%] w-[50%] h-[55%] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(240,170,110,0.18) 0%, transparent 55%)" }}
        />
        <div
          className="absolute bottom-[-15%] right-[10%] w-[55%] h-[60%] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(140,80,220,0.20) 0%, transparent 55%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                135deg,
                transparent,
                transparent 48px,
                rgba(255,255,255,0.07) 48px,
                rgba(255,255,255,0.07) 49px
              ),
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 48px,
                rgba(255,255,255,0.05) 48px,
                rgba(255,255,255,0.05) 49px
              )
            `,
          }}
        />
        {content}
      </div>
    );
  }

  return <div className={isDark ? "dark" : ""}>{content}</div>;
}
