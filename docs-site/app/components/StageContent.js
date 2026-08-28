"use client";

import Link from "next/link";
import { useTheme } from "./ThemeContext";
import MarkdownRenderer from "./MarkdownRenderer";
import AlgorithmCard from "./AlgorithmCard";
import StageObjective from "./StageObjective";
import BTreeVisualizer from "./BTreeVisualizer";

function NavLink({ stage, direction, isGlass }) {
  const isNext = direction === "next";
  return (
    <Link
      href={`/stages/${stage.slug}`}
      className={`flex-1 rounded-xl p-4 transition-colors ${
        isGlass
          ? "bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10]"
          : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
      } ${isNext ? "text-right" : ""}`}
    >
      <div className={`text-xs font-medium mb-1 ${
        isGlass ? "text-gray-400" : "text-gray-500 dark:text-gray-400"
      }`}>
        {isNext ? "Next →" : "← Previous"}
      </div>
      <div className={`text-sm font-semibold ${
        isGlass ? "text-white" : "text-gray-900 dark:text-white"
      }`}>
        {stage.num ? `Stage ${stage.num}: ` : ""}
        {stage.title}
      </div>
    </Link>
  );
}

export default function StageContent({ tutorial, stage, slug, prev, next, fallback }) {
  const { isGlass } = useTheme();

  const textPrimary = isGlass ? "text-white" : "text-gray-900 dark:text-white";
  const textMuted = isGlass ? "text-gray-400" : "text-gray-500 dark:text-gray-400";

  if (fallback) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/" className={`text-sm ${
          isGlass ? "text-gray-300 hover:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        } transition-colors`}>
          ← Back to all stages
        </Link>
        {stage.num && (
          <span className={`inline-block ml-3 text-[10px] font-bold px-2 py-0.5 rounded ${
            isGlass
              ? "bg-purple-500/30 text-purple-200"
              : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
          }`}>
            Stage {stage.num}
          </span>
        )}
        <div className="mt-6">
          <MarkdownRenderer content={stage.content} />
        </div>
        <div className="flex gap-4 mt-8">
          {prev ? <NavLink stage={prev} direction="prev" isGlass={isGlass} /> : <div className="flex-1" />}
          {next ? <NavLink stage={next} direction="next" isGlass={isGlass} /> : <div className="flex-1" />}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className={`flex items-center gap-2 text-sm ${textMuted}`}>
        <Link href="/" className={`hover:${isGlass ? "text-white" : "text-gray-700 dark:text-gray-200"} transition-colors`}>
          Home
        </Link>
        <span>›</span>
        <span>{tutorial.section}</span>
        <span>›</span>
        <span>Stage {tutorial.stage}</span>
      </div>

      {/* Title */}
      <h1 className={`text-2xl md:text-3xl font-bold mt-4 ${textPrimary}`}>
        {tutorial.title}
      </h1>
      <p className={`text-base mt-2 ${isGlass ? "text-gray-300" : "text-gray-600 dark:text-gray-400"}`}>
        {tutorial.subtitle}
      </p>

      {/* Objective */}
      <StageObjective objective={tutorial.objective} />

      {/* YouTube */}
      {tutorial.youtubeId && (
        <section className="my-6">
          <h2 className={`text-lg font-semibold mb-3 ${textPrimary}`}>Video Walkthrough</h2>
          <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl border border-white/[0.10]">
            <iframe
              src={`https://www.youtube.com/embed/${tutorial.youtubeId}`}
              title={`${tutorial.title} Video Walkthrough`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full border-0"
            />
          </div>
        </section>
      )}

      {/* Core Concepts */}
      {tutorial.concepts && tutorial.concepts.length > 0 && (
        <section className="my-6">
          <h2 className={`text-lg font-semibold mb-3 ${textPrimary}`}>Core Concepts</h2>
          <ul className="space-y-2">
            {tutorial.concepts.map((concept, i) => (
              <li key={i} className={`flex items-start gap-2 text-sm ${
                isGlass ? "text-gray-200" : "text-gray-700 dark:text-gray-300"
              }`}>
                <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                  isGlass ? "bg-purple-400" : "bg-blue-500"
                }`} />
                {concept}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* B+Tree Visualizer */}
      <BTreeVisualizer slug={slug} />

      {/* Body content */}
      {tutorial.bodyContent && (
        <section className="my-6">
          <MarkdownRenderer content={tutorial.bodyContent} />
        </section>
      )}

      {/* Algorithm Cards */}
      {tutorial.algorithms && tutorial.algorithms.length > 0 && (
        <section className="my-6">
          <h2 className={`text-lg font-semibold mb-3 ${textPrimary}`}>Conceptual Execution Algorithms</h2>
          {tutorial.algorithms.map((algo, i) => (
            <AlgorithmCard
              key={i}
              index={i}
              title={algo.title}
              description={algo.description}
              steps={algo.steps}
            />
          ))}
        </section>
      )}

      {/* Implementation Checklist */}
      {tutorial.checklist && tutorial.checklist.length > 0 && (
        <section className="my-6">
          <h2 className={`text-lg font-semibold mb-3 ${textPrimary}`}>Implementation Checklist</h2>
          <div className={`rounded-xl p-5 ${
            isGlass
              ? "bg-white/[0.06] border border-white/[0.10]"
              : "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
          }`}>
            <ul className="space-y-2">
              {tutorial.checklist.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`check-${i}`}
                    disabled
                    className={`w-4 h-4 rounded border ${
                      isGlass ? "border-white/[0.20] bg-white/[0.05]" : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  <label htmlFor={`check-${i}`} className={`text-sm ${
                    isGlass ? "text-gray-200" : "text-gray-700 dark:text-gray-300"
                  }`}>
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Launch Code Editor */}
      <div className="my-8 text-center">
        <Link
          href={`/playground/${slug}`}
          className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold transition-all ${
            isGlass
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02]"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          }`}
        >
          Launch Code Editor
        </Link>
      </div>

      {/* Prev / Next nav */}
      <div className="flex gap-4 mt-8 mb-4">
        {prev ? <NavLink stage={prev} direction="prev" isGlass={isGlass} /> : <div className="flex-1" />}
        {next ? <NavLink stage={next} direction="next" isGlass={isGlass} /> : <div className="flex-1" />}
      </div>
    </div>
  );
}
