"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "./AuthContext";

export const Editor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 32, color: "#8888a8", fontFamily: "var(--font-mono)", fontSize: 13 }}>
      Loading editor...
    </div>
  ),
});

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const LANG_EXT = { c: ".c", cpp: ".cpp", rust: ".rs", zig: ".zig" };
export const LANG_PREFIX = { c: "c-droid", cpp: "cpp-droid", rust: "rust-droid", zig: "zig-droid" };

export const PROGRESS_PHASES = [
  { key: "submitting", label: "Submitting" },
  { key: "compiling", label: "Compiling" },
  { key: "testing", label: "Running Tests" },
  { key: "done", label: "Done" },
];

export const LANGS = [
  { id: "c", label: "C" },
  { id: "cpp", label: "C++" },
  { id: "rust", label: "Rust" },
  { id: "zig", label: "Zig" },
];

export const TUTORIAL_STAGES = [
  { section: "Command Loop", stages: [{ num: 1, slug: "database/repl", title: "The REPL" }] },
  { section: "SQL Compiler", stages: [
    { num: 2, slug: "database/lexer", title: "Lexer" },
    { num: 3, slug: "database/parser", title: "Parser" },
  ]},
  { section: "Row Serialization", stages: [{ num: 4, slug: "database/row-serialization", title: "Row Packing" }] },
  { section: "Pager & Buffer", stages: [{ num: 5, slug: "database/pager", title: "File Paging" }] },
  { section: "B+Tree Engine", stages: [
    { num: 6, slug: "database/btree-leaf", title: "Leaf Nodes" },
    { num: 7, slug: "database/btree-search", title: "Search & Insert" },
    { num: 8, slug: "database/btree-split", title: "Leaf Splits" },
    { num: 9, slug: "database/persistence", title: "Internal Splits" },
  ]},
  { section: "Query Execution", stages: [
    { num: 10, slug: "database/planner", title: "Persistence & WHERE" },
    { num: 11, slug: "database/index-scan", title: "Volcano Executor" },
    { num: 12, slug: "database/delete-update", title: "DELETE & UPDATE" },
  ]},
];

export function getMonacoLanguage(filename) {
  if (filename.endsWith(".c") || filename.endsWith(".h")) return "c";
  if (filename.endsWith(".cpp") || filename.endsWith(".hpp")) return "cpp";
  if (filename.endsWith(".rs")) return "rust";
  if (filename.endsWith(".zig")) return "c";
  if (filename.endsWith(".toml")) return "toml";
  return "plaintext";
}

function FileIconBadge({ letter, bg, fg = "#fff" }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded font-bold shrink-0"
      style={{ width: 16, height: 16, fontSize: 9, lineHeight: 1, background: bg, color: fg }}
    >
      {letter}
    </span>
  );
}

export function getFileIcon(filename) {
  if (filename.endsWith(".c")) return <FileIconBadge letter="C" bg="#005fa3" />;
  if (filename.endsWith(".cpp")) return <FileIconBadge letter="C+" bg="#9c33cf" />;
  if (filename.endsWith(".h") || filename.endsWith(".hpp")) return <FileIconBadge letter="H" bg="#6a9e3a" />;
  if (filename.endsWith(".rs")) return <FileIconBadge letter="R" bg="#ce422b" />;
  if (filename.endsWith(".toml")) return <FileIconBadge letter="T" bg="#6b7280" />;
  if (filename.endsWith(".zig")) return <FileIconBadge letter="Z" bg="#f7a41d" fg="#000" />;
  return <FileIconBadge letter="F" bg="#6b7280" />;
}

export function handleEditorWillMount(monaco) {
  monaco.editor.defineTheme("droid-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "8a9a80", fontStyle: "italic" },
      { token: "keyword", foreground: "2e7d50" },
      { token: "keyword.control", foreground: "2e7d50" },
      { token: "keyword.operator", foreground: "3d7050" },
      { token: "string", foreground: "986820" },
      { token: "string.escape", foreground: "a06030" },
      { token: "number", foreground: "a06030" },
      { token: "type", foreground: "1a8878" },
      { token: "type.identifier", foreground: "1a8878" },
      { token: "function", foreground: "3d7050" },
      { token: "variable", foreground: "1a1e14" },
      { token: "constant", foreground: "a06030" },
      { token: "operator", foreground: "3d7050" },
      { token: "delimiter", foreground: "4a5040" },
      { token: "delimiter.bracket", foreground: "4a5040" },
      { token: "tag", foreground: "a05838" },
      { token: "attribute.name", foreground: "1a8878" },
      { token: "attribute.value", foreground: "986820" },
      { token: "meta.preprocessor", foreground: "a05838" },
      { token: "annotation", foreground: "a06030" },
    ],
    colors: {
      "editor.background": "#f8f9f4",
      "editor.foreground": "#1a1e14",
      "editor.lineHighlightBackground": "#f0f2ea",
      "editor.selectionBackground": "#3d705026",
      "editor.inactiveSelectionBackground": "#3d705015",
      "editorCursor.foreground": "#3d7050",
      "editorLineNumber.foreground": "#a0a294",
      "editorLineNumber.activeForeground": "#4a5040",
      "editorIndentGuide.background": "#e4e6da",
      "editorIndentGuide.activeBackground": "#c8cabc",
      "editorBracketMatch.background": "#3d705020",
      "editorBracketMatch.border": "#3d705050",
      "editor.wordHighlightBackground": "#3d705015",
      "editorWhitespace.foreground": "#e4e6da",
      "editorWidget.background": "#f5f6ee",
      "editorWidget.border": "#e4e6da",
      "editorSuggestWidget.background": "#f5f6ee",
      "editorSuggestWidget.border": "#e4e6da",
      "editorSuggestWidget.selectedBackground": "#3d705026",
      "editorHoverWidget.background": "#f5f6ee",
      "editorHoverWidget.border": "#e4e6da",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#a0a29430",
      "scrollbarSlider.hoverBackground": "#a0a29450",
      "scrollbarSlider.activeBackground": "#3d705050",
      "minimap.background": "#f8f9f4",
    },
  });

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

export function usePlaygroundLogic(stageSlug) {
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
  const [confirmingDelete, setConfirmingDelete] = useState(null);
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
    if (saveStatus === "saved") setSaveStatus(null);
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
    if (saveStatus === "saved") setSaveStatus(null);
  };

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
      if (saveStatus === "saved") setSaveStatus(null);
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

  return {
    activeLang, setActiveLang,
    filesMap, setFilesMap,
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
    user, token,
    apiSlug,
    stageLabel,
    fileList,
    saveWorkspace,
    resetToTemplate,
    handleFileContentChange,
    handleCreateFile,
    confirmCreateFile,
    handleDeleteFile,
    submitCode,
  };
}
