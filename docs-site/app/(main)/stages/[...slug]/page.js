import { notFound } from "next/navigation";
import { getStageBySlug, getAllSlugs, getStages, getExtras, getTutorialContent } from "@/lib/stages";
import StageContent from "@/app/components/StageContent";

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug: slug.split("/") }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const joined = slug.join("/");
  const tutorial = getTutorialContent(joined);
  const stage = getStageBySlug(joined);
  const title = tutorial?.title || stage?.title || "Not Found";
  const description = tutorial?.objective || stage?.summary?.slice(0, 160);
  return { title: `${title} — droid Tutorial`, description };
}

export default async function StagePage({ params }) {
  const { slug } = await params;
  const joined = slug.join("/");
  const stage = getStageBySlug(joined);
  if (!stage) notFound();

  const tutorial = getTutorialContent(joined);

  const allStages = [...getStages(), ...getExtras()];
  const currentIdx = allStages.findIndex((s) => s.slug === joined);
  const prev = currentIdx > 0 ? allStages[currentIdx - 1] : null;
  const next = currentIdx < allStages.length - 1 ? allStages[currentIdx + 1] : null;

  if (tutorial) {
    return (
      <StageContent
        tutorial={tutorial}
        slug={joined}
        prev={prev}
        next={next}
        stage={stage}
      />
    );
  }

  return (
    <StageContent
      stage={stage}
      slug={joined}
      prev={prev}
      next={next}
      fallback
    />
  );
}
