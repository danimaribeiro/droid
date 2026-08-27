import Link from "next/link";
import { notFound } from "next/navigation";
import { getStageBySlug, getAllSlugs, getStages, getExtras, getTutorialContent } from "@/lib/stages";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import AlgorithmCard from "@/app/components/AlgorithmCard";
import StageObjective from "@/app/components/StageObjective";
import CodeSubmitRunner from "@/app/components/CodeSubmitRunner";
import BTreeVisualizer from "@/app/components/BTreeVisualizer";

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tutorial = getTutorialContent(slug);
  const stage = getStageBySlug(slug);
  const title = tutorial?.title || stage?.title || "Not Found";
  const description = tutorial?.objective || stage?.summary?.slice(0, 160);
  return { title: `${title} — droid Tutorial`, description };
}

export default async function StagePage({ params }) {
  const { slug } = await params;
  const stage = getStageBySlug(slug);
  if (!stage) notFound();

  const tutorial = getTutorialContent(slug);

  // Build prev/next navigation
  const allStages = [...getStages(), ...getExtras()];
  const currentIdx = allStages.findIndex((s) => s.slug === slug);
  const prev = currentIdx > 0 ? allStages[currentIdx - 1] : null;
  const next = currentIdx < allStages.length - 1 ? allStages[currentIdx + 1] : null;

  // If we have tutorial content, use the new layout
  if (tutorial) {
    return (
      <div className="tutorial-main">
          {/* Breadcrumb */}
          <div className="tutorial-breadcrumb">
            <Link href="/">Home</Link>
            <span className="breadcrumb-sep">›</span>
            <span>{tutorial.section}</span>
            <span className="breadcrumb-sep">›</span>
            <span>Stage {tutorial.stage}</span>
          </div>

          {/* Title */}
          <h1 className="tutorial-title">{tutorial.title}</h1>
          <p className="tutorial-subtitle">{tutorial.subtitle}</p>

          {/* Stage Objective */}
          <StageObjective objective={tutorial.objective} />

          {/* YouTube Video Walkthrough */}
          {tutorial.youtubeId && (
            <section className="tutorial-section">
              <h2>🎬 Video Walkthrough</h2>
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 12, border: "1px solid #30363d", marginTop: 16 }}>
                <iframe
                  src={`https://www.youtube.com/embed/${tutorial.youtubeId}`}
                  title={`${tutorial.title} Video Walkthrough`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                />
              </div>
            </section>
          )}

          {/* Core Concepts */}
          {tutorial.concepts && tutorial.concepts.length > 0 && (
            <section className="tutorial-section">
              <h2>💡 Core Concepts</h2>
              <ul className="tutorial-concepts-list">
                {tutorial.concepts.map((concept, i) => (
                  <li key={i}>{concept}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Interactive B+Tree Architecture Lab */}
          <BTreeVisualizer slug={slug} />

          {/* Body content (markdown comes before conceptual execution!) */}
          {tutorial.bodyContent && (
            <section className="tutorial-section tutorial-body">
              <MarkdownRenderer content={tutorial.bodyContent} />
            </section>
          )}

          {/* Algorithm Cards */}
          {tutorial.algorithms && tutorial.algorithms.length > 0 && (
            <section className="tutorial-section">
              <h2>⚡ Conceptual Execution Algorithms</h2>
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
            <section className="tutorial-section">
              <h2>✅ Implementation Checklist (Matches Test Harness)</h2>
              <ul className="tutorial-checklist">
                {tutorial.checklist.map((item, i) => (
                  <li key={i}>
                    <input type="checkbox" id={`check-${i}`} disabled />
                    <label htmlFor={`check-${i}`}>{item}</label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Link to Full Multi-File Workspace Playground */}
          {slug === "stage1-repl" && (
            <div style={{ marginTop: 24, marginBottom: 24, textAlign: "center" }}>
              <Link href="/playground/stage1" style={{ display: "inline-block", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15, boxShadow: "0 4px 16px rgba(99, 102, 241, 0.4)" }}>
                🚀 Launch Multi-File Code Editor Workspace (/playground/stage1)
              </Link>
            </div>
          )}

          {/* Interactive Submission Workspace and Test Harness */}
          <CodeSubmitRunner slug={slug} />

          {/* Prev / Next navigation */}
          <div className="stage-page-nav">
            {prev ? (
              <Link href={`/stages/${prev.slug}`} className="stage-nav-link prev">
                <span className="stage-nav-label">← Previous</span>
                <span className="stage-nav-title">
                  {prev.num ? `Stage ${prev.num}: ` : ""}
                  {prev.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link href={`/stages/${next.slug}`} className="stage-nav-link next">
                <span className="stage-nav-label">Next →</span>
                <span className="stage-nav-title">
                  {next.num ? `Stage ${next.num}: ` : ""}
                  {next.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
          </div>
      </div>
    );
  }

  // Fallback: old layout for stages without tutorial content
  const isExtra = slug.startsWith("extra-");
  const partClass = isExtra ? "extra" : stage.part ? `part-${stage.part}` : "";

  return (
      <div className="tutorial-main">
        <div className="stage-page fade-in">
          <Link href="/" className="stage-page-back">
            ← Back to all stages
          </Link>
          <div className="stage-page-badge">
            {stage.num && (
              <span className={`part-badge ${partClass}`}>Stage {stage.num}</span>
            )}
            {isExtra && <span className="part-badge extra">Extra</span>}
          </div>
          <MarkdownRenderer content={stage.content} />
          <div className="stage-page-nav">
            {prev ? (
              <Link href={`/stages/${prev.slug}`} className="stage-nav-link prev">
                <span className="stage-nav-label">← Previous</span>
                <span className="stage-nav-title">
                  {prev.num ? `Stage ${prev.num}: ` : ""}
                  {prev.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link href={`/stages/${next.slug}`} className="stage-nav-link next">
                <span className="stage-nav-label">Next →</span>
                <span className="stage-nav-title">
                  {next.num ? `Stage ${next.num}: ` : ""}
                  {next.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
  );
}
