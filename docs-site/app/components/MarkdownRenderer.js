"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useState, useId } from "react";
import mermaid from "mermaid";
import { useTheme } from "./ThemeContext";

function MermaidBlock({ chart }) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);
  const { isGlass } = useTheme();
  const rawId = useId();
  const chartId = "mermaid_" + rawId.replace(/[^a-zA-Z0-9]/g, "_");

  useEffect(() => {
    let isMounted = true;
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
        fontFamily: "var(--font-mono, monospace)",
      });

      mermaid
        .render(chartId, chart)
        .then((result) => {
          if (isMounted && result && result.svg) {
            setSvg(result.svg);
          }
        })
        .catch((err) => {
          console.error("Failed to render Mermaid chart:", err);
          if (isMounted) setError(true);
        });
    } catch (e) {
      console.error("Mermaid initialization error:", e);
      if (isMounted) setError(true);
    }

    return () => {
      isMounted = false;
      const el = document.getElementById(chartId);
      if (el) el.remove();
    };
  }, [chart, chartId]);

  if (error) {
    return (
      <div className={`rounded-xl p-4 my-4 ${
        isGlass
          ? "bg-red-500/10 border border-red-500/20"
          : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40"
      }`}>
        <span className={`text-xs font-bold ${isGlass ? "text-red-300" : "text-red-600 dark:text-red-400"}`}>
          Diagram Render Error
        </span>
        <pre className="mt-2 text-xs font-mono overflow-x-auto text-gray-400">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className={`rounded-xl p-6 my-4 text-center ${
        isGlass ? "bg-white/[0.05]" : "bg-gray-50 dark:bg-gray-800/50"
      }`}>
        <span className={`text-sm ${isGlass ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>
          Rendering diagram...
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden my-4 ${
      isGlass
        ? "bg-white/[0.06] border border-white/[0.10]"
        : "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
    }`}>
      <div className={`px-4 py-2 text-[10px] font-bold tracking-wider uppercase border-b ${
        isGlass
          ? "text-gray-400 border-white/[0.08]"
          : "text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
      }`}>
        Architecture Diagram
      </div>
      <div className="p-4 overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}

export default function MarkdownRenderer({ content }) {
  const { isGlass } = useTheme();

  return (
    <div className={`prose max-w-none ${
      isGlass
        ? "prose-invert prose-p:text-gray-200 prose-headings:text-white prose-strong:text-white prose-code:text-purple-300 prose-a:text-blue-300 prose-li:text-gray-200 prose-blockquote:border-white/[0.15] prose-blockquote:text-gray-300 prose-pre:bg-gray-950 prose-pre:border prose-pre:border-white/[0.10]"
        : "dark:prose-invert prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700"
    }`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            if (!inline && match && match[1] === "mermaid") {
              return <MermaidBlock chart={String(children).replace(/\n$/, "")} />;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
