import MultiFilePlayground from "@/app/components/MultiFilePlayground";
import { getAllSlugs } from "@/lib/stages";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${title} — Code Editor — droid Tutorial`,
    description: `Interactive multi-file code editor and automated test runner for ${title}.`,
  };
}

export default async function PlaygroundPage({ params }) {
  const { slug } = await params;

  return (
    <div className="playground-page">
      <MultiFilePlayground stageSlug={slug} />
    </div>
  );
}
