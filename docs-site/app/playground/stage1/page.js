import MultiFilePlayground from "@/app/components/MultiFilePlayground";

export const metadata = {
  title: "Stage 1 Workspace & REPL Sandbox — droid Tutorial",
  description: "Interactive multi-file code editor and automated test runner for Stage 1 (User REPL)."
};

export default function Stage1PlaygroundPage() {
  return (
    <div className="tutorial-main" style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      <MultiFilePlayground stageSlug="database/repl" />
    </div>
  );
}
