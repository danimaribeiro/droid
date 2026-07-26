import Link from "next/link";
import { getStages, getExtras, getPartInfo, PART_NAMES } from "@/lib/stages";

export default function HomePage() {
  const stages = getStages();
  const extras = getExtras();
  const parts = getPartInfo();

  const partColors = {
    1: "part-1",
    2: "part-2",
    3: "part-3",
    4: "part-4",
    5: "part-5",
    6: "part-6",
  };

  // Group stages by part
  const stagesByPart = {};
  for (const stage of stages) {
    if (!stagesByPart[stage.part]) stagesByPart[stage.part] = [];
    stagesByPart[stage.part].push(stage);
  }

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <h1>
          Build a <span>Database Engine</span>
          <br />
          From Scratch
        </h1>
        <p className="hero-subtitle">
          A hands-on tutorial where you implement a complete database in C, Rust, Zig, or C++ —
          from a REPL and SQL parser to B-trees, transactions, WAL crash recovery,
          query optimization, and beyond.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value">33</div>
            <div className="hero-stat-label">Stages</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">6</div>
            <div className="hero-stat-label">Parts</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">13</div>
            <div className="hero-stat-label">Extras</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">4</div>
            <div className="hero-stat-label">Languages</div>
          </div>
        </div>
      </section>

      {/* Parts */}
      <div className="parts-grid">
        {parts.map((part) => (
          <section key={part.num} className={`part-section ${partColors[part.num]}`}>
            <div className="part-header">
              <span className={`part-badge ${partColors[part.num]}`}>Part {part.num}</span>
              <h2 className="part-title">{part.name}</h2>
            </div>
            <p className="part-description">{part.description}</p>
            <div className="stages-grid">
              {(stagesByPart[part.num] || []).map((stage) => (
                <Link
                  key={stage.slug}
                  href={`/stages/${stage.slug}`}
                  className="stage-card"
                >
                  <div className="stage-card-header">
                    <span className="stage-card-num">{stage.num}</span>
                    <span className="stage-card-title">{stage.title}</span>
                  </div>
                  <p className="stage-card-summary">{stage.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* Extras */}
        <section className="part-section extra">
          <div className="part-header">
            <span className="part-badge extra">Extras</span>
            <h2 className="part-title">Independent Topics</h2>
          </div>
          <p className="part-description">
            Standalone modules that can be implemented at any point. Each covers an important
            database concept that enriches the learning experience.
          </p>
          <div className="stages-grid">
            {extras.map((extra) => (
              <Link
                key={extra.slug}
                href={`/stages/${extra.slug}`}
                className="stage-card"
              >
                <div className="stage-card-header">
                  <span className="stage-card-num">✦</span>
                  <span className="stage-card-title">{extra.title}</span>
                </div>
                <p className="stage-card-summary">{extra.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
