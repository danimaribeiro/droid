import Link from "next/link";
import { getPartInfo } from "@/lib/stages";
import TerminalPreview from "./components/TerminalPreview";

const PART_META = {
  1: { 
    icon: "⚙️", 
    tag: "CORE ENGINE", 
    stages: "Stages 1–12", 
    slug: "stage1-repl",
    ready: true,
    statusText: "🟢 STAGES 1–12 READY" 
  },
  2: { 
    icon: "⚡", 
    tag: "STORAGE & WAL", 
    stages: "Stages 1–8", 
    slug: "part2-stage1-wal",
    ready: false,
    statusText: "🚧 UNDER CONSTRUCTION" 
  },
  3: { 
    icon: "🧠", 
    tag: "COMPLETE SQL", 
    stages: "Stages 1–4", 
    slug: "part3-stage1-advanced-where",
    ready: false,
    statusText: "🚧 UNDER CONSTRUCTION" 
  },
  4: { 
    icon: "🔍", 
    tag: "OPTIMIZATION", 
    stages: "Stages 1–3", 
    slug: "part4-stage1-secondary-indexes",
    ready: false,
    statusText: "🚧 UNDER CONSTRUCTION" 
  },
  5: { 
    icon: "🔗", 
    tag: "RELATIONSHIPS", 
    stages: "Stages 1–4", 
    slug: "part5-stage1-joins-nested-loop",
    ready: false,
    statusText: "🚧 UNDER CONSTRUCTION" 
  },
  6: { 
    icon: "🛡️", 
    tag: "CONCURRENCY", 
    stages: "Stages 1–3", 
    slug: "part6-stage1-lock-manager",
    ready: false,
    statusText: "🚧 UNDER CONSTRUCTION" 
  },
};

const FEATURES = [
  { icon: "📜", title: "Custom Lexer & Parser", description: "Write a character scanner and recursive descent AST builder from scratch without Yacc/Bison." },
  { icon: "🌳", title: "B-Tree Page Allocation", description: "Master 4KB binary disk pages, byte serialization, cell offsets, and B-Tree node splits." },
  { icon: "💾", title: "WAL & Crash Durability", description: "Implement write-ahead logging and recovery algorithms to survive abrupt power losses." },
  { icon: "⚡", title: "Volcano Query Executor", description: "Build a pull-based iterative relational operator pipeline for SeqScan, IndexScan, and Joins." },
  { icon: "🔐", title: "MVCC & Transactions", description: "Handle multi-version concurrency control, transaction isolation, lock managers, and deadlocks." },
  { icon: "🧪", title: "Contract-Driven Tests", description: "Validate your custom binary against comprehensive, language-agnostic integration test suites." },
];

export default function HomePage() {
  const parts = getPartInfo();

  return (
    <div className="landing-wrapper">
      {/* Top Navigation Bar with Auth Component */}
      <header className="nav-top-bar">
        <Link href="/" className="nav-brand">
          <span>🗄️ Database Curriculum</span>
        </Link>
        <div className="nav-auth">
          <button className="btn-login-ghost">Log In</button>
          <button className="btn-signup-solid">Sign Up</button>
        </div>
      </header>

      {/* Glow Background Decor */}
      <div className="landing-bg-glow glow-1" />
      <div className="landing-bg-glow glow-2" />

      {/* Hero Section */}
      <section className="hero-modern">
        <div className="hero-modern-grid">
          
          {/* Left Column: Value Proposition & CTAs */}
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-pulse" />
              <span>INTERACTIVE DATABASE INTERNALS CURRICULUM</span>
            </div>
            
            <h1 className="hero-heading">
              Don't Just Query.<br />
              <span className="text-gradient">Build the Engine.</span>
            </h1>
            
            <p className="hero-tagline">
              A deep technical journey where you construct a full relational SQL storage engine from zero. 
              Master lexical parsing, B-tree disk structures, buffer pools, WAL recovery, and query planners.
            </p>

            <div className="hero-actions">
              <Link href="/stages/stage1-repl" className="btn-glow-primary">
                <span>Start Part 1 Tutorial</span>
                <span className="btn-arrow">→</span>
              </Link>
              <a 
                href="https://github.com/danimaribeiro/droid" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-outline-secondary"
              >
                <span>⭐ Star on GitHub</span>
              </a>
            </div>

            {/* Supported Languages Banner */}
            <div className="language-support">
              <span className="lang-label">IMPLEMENT IN YOUR FAVORITE LANGUAGE:</span>
              <div className="lang-chips">
                <span className="lang-chip chip-c">C</span>
                <span className="lang-chip chip-cpp">C++</span>
                <span className="lang-chip chip-rust">Rust</span>
                <span className="lang-chip chip-zig">Zig</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Terminal Preview */}
          <div className="hero-terminal">
            <TerminalPreview />
          </div>

        </div>
      </section>

      {/* How It Works (The Learning Workflow) */}
      <section className="section-container">
        <div className="section-header-center">
          <span className="section-badge">THE WORKFLOW</span>
          <h2 className="section-heading">How the Curriculum Works</h2>
          <p className="section-subheading">
            A battle-tested methodology inspired by industrial software systems. No magic libraries.
          </p>
        </div>

        <div className="workflow-grid">
          <div className="workflow-card">
            <div className="workflow-step-number">01</div>
            <div className="workflow-icon">💡</div>
            <h3 className="workflow-title">Understand the Architecture</h3>
            <p className="workflow-desc">
              Each stage breaks down complex systems (like B-Tree node layout or buffer cache eviction) into clear conceptual diagrams and straightforward checklists.
            </p>
          </div>

          <div className="workflow-connector">→</div>

          <div className="workflow-card">
            <div className="workflow-step-number">02</div>
            <div className="workflow-icon">💻</div>
            <h3 className="workflow-title">Write the Systems Code</h3>
            <p className="workflow-desc">
              Write true bare-metal algorithms in C, C++, Rust, or Zig. You allocate memory, handle binary file offsets, and build data representations directly.
            </p>
          </div>

          <div className="workflow-connector">→</div>

          <div className="workflow-card">
            <div className="workflow-step-number">03</div>
            <div className="workflow-icon">🎯</div>
            <h3 className="workflow-title">Pass Automated Contracts</h3>
            <p className="workflow-desc">
              Run our comprehensive Python integration test harness against your binary to verify byte-exact storage output, SQL correctness, and resilience.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Highlights / Core Features */}
      <section className="section-container bg-subtle">
        <div className="section-header-center">
          <span className="section-badge">SYSTEM INTERNALS</span>
          <h2 className="section-heading">What You Will Implement</h2>
          <p className="section-subheading">
            Every layer of a production database, constructed piece by piece.
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map((feat, index) => (
            <div key={index} className="feature-card">
              <span className="feature-icon">{feat.icon}</span>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Curriculum Roadmap (The 6 Parts with Construction Badges) */}
      <section className="section-container">
        <div className="section-header-center">
          <span className="section-badge">ROADMAP & PROGRESS</span>
          <h2 className="section-heading">The Complete Curriculum</h2>
          <p className="section-subheading">
            6 progressive stages from simple command loop to full concurrent DBMS.
          </p>
        </div>

        <div className="roadmap-grid">
          {parts.map((part) => {
            const meta = PART_META[part.num] || PART_META[1];
            return (
              <Link key={part.num} href={`/stages/${meta.slug}`} className="roadmap-card">
                <div className="roadmap-card-top">
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span className="roadmap-part-num">Part {part.num}</span>
                    <span className={meta.ready ? "badge-ready" : "badge-construction"}>
                      {meta.statusText}
                    </span>
                  </div>
                  <span className="roadmap-tag">{meta.tag}</span>
                </div>
                
                <div className="roadmap-title-row">
                  <span className="roadmap-icon">{meta.icon}</span>
                  <h3 className="roadmap-title">{part.name}</h3>
                </div>

                <p className="roadmap-desc">{part.description}</p>

                <div className="roadmap-footer">
                  <span className="roadmap-stages-badge">{meta.stages}</span>
                  <span className="roadmap-cta">Explore Stage →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Signup UI Component Card for Saving Progress */}
      <div className="signup-section-card">
        <div>
          <span className="section-badge">MEMBERSHIP & SAVE STATE</span>
          <h2 className="signup-card-title">Save Your Tutorial Progress</h2>
          <p className="signup-card-desc">
            Create a free developer account to record completed stages, track test executions across machines, and earn completion certificates as you build each database layer.
          </p>
        </div>
        <div className="signup-form-ui">
          <input type="text" placeholder="Developer Handle (e.g. torvalds)" className="signup-input" readOnly />
          <input type="email" placeholder="you@domain.com" className="signup-input" readOnly />
          <button className="btn-glow-primary" style={{ width: "100%" }}>
            <span>Create Free Account</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Footer / Final Call to Action */}
      <footer className="landing-footer">
        <div className="footer-box">
          <h2 className="footer-heading">Ready to dive into systems engineering?</h2>
          <p className="footer-text">Pick up your favorite terminal and start with Stage 1.</p>
          <Link href="/stages/stage1-repl" className="btn-glow-primary">
            <span>Begin Stage 1: The REPL</span>
            <span>→</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
