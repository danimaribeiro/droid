"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useState, useId } from "react";
import mermaid from "mermaid";

function MermaidBlock({ chart }) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);
  const rawId = useId();
  // Ensure a safe DOM selector ID for mermaid compiler
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

      // Render chart asynchronously into static SVG HTML string
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
      // Cleanup any dangling temporary render elements created by mermaid
      const el = document.getElementById(chartId);
      if (el) el.remove();
    };
  }, [chart, chartId]);

  if (error) {
    return (
      <div className="mermaid-fallback-error">
        <span className="err-badge">⚠️ MERMAID DIAGRAM RENDER WARNING</span>
        <pre className="err-code">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="mermaid-loading-box">
        <span className="loading-dots">⏳ Rendering vector memory architecture diagram...</span>
      </div>
    );
  }

  return (
    <div className="mermaid-chart-box">
      <div className="mermaid-badge">📊 VECTOR ARCHITECTURE DIAGRAM (MERMAID)</div>
      <div
        className="mermaid-svg-wrapper"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

export default function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-body">
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
