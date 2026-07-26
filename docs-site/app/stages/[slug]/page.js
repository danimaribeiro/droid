import Link from "next/link";
import { notFound } from "next/navigation";
import { getStageBySlug, getAllSlugs, getStages, getExtras } from "@/lib/stages";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const stage = getStageBySlug(slug);
  if (!stage) return { title: "Not Found" };
  return {
    title: `${stage.title} — droid Tutorial`,
    description: stage.summary?.slice(0, 160),
  };
}

export default async function StagePage({ params }) {
  const { slug } = await params;
  const stage = getStageBySlug(slug);
  if (!stage) notFound();

  // Build prev/next navigation
  const allStages = [...getStages(), ...getExtras()];
  const currentIdx = allStages.findIndex((s) => s.slug === slug);
  const prev = currentIdx > 0 ? allStages[currentIdx - 1] : null;
  const next = currentIdx < allStages.length - 1 ? allStages[currentIdx + 1] : null;

  const isExtra = slug.startsWith("extra-");
  const partClass = isExtra
    ? "extra"
    : stage.part
    ? `part-${stage.part}`
    : "";

  return (
    <div className="stage-page fade-in">
      <Link href="/" className="stage-page-back">
        ← Back to all stages
      </Link>

      <div className="stage-page-badge">
        {stage.num && (
          <span className={`part-badge ${partClass}`}>
            Stage {stage.num}
          </span>
        )}
        {isExtra && <span className="part-badge extra">Extra</span>}
      </div>

      <MarkdownRenderer content={stage.content} />

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
