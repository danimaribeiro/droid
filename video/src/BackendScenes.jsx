import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CodePanel, MONO } from "./Code";

const BG = "#0f0a1a";
const SANS = "Inter, system-ui, sans-serif";
const ACCENT = "#c792ea";

/** Staggered spring, 0 → 1. */
function useEnter(delay = 0, config = { damping: 20, mass: 0.7 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return Math.max(0, spring({ frame: frame - delay, fps, config }));
}

function SceneShell({ eyebrow, title, children }) {
  const t = useEnter(0);
  return (
    <AbsoluteFill
      style={{
        background: BG,
        padding: "56px 72px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          opacity: t,
          transform: `translateY(${interpolate(t, [0, 1], [-18, 0])}px)`,
          marginBottom: 34,
        }}
      >
        {eyebrow && (
          <div
            style={{
              fontFamily: SANS,
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(199,146,234,0.85)",
              marginBottom: 10,
            }}
          >
            {eyebrow}
          </div>
        )}
        <div
          style={{
            fontFamily: SANS,
            fontSize: 52,
            fontWeight: 800,
            color: "white",
            letterSpacing: -0.5,
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
}

/* ── Transition ─────────────────────────────────────────────── */

export function TransitionCard() {
  const title = useEnter(0, { damping: 18, mass: 0.9 });
  const sub = useEnter(14, { damping: 18, mass: 0.9 });

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #1a2a5c 0%, #1a1140 45%, #2d1248 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "20%",
          width: "60%",
          height: "70%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(130,170,255,0.20) 0%, transparent 58%)",
        }}
      />
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 7,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.42)",
            marginBottom: 22,
            opacity: title,
          }}
        >
          Under the Hood
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 88,
            fontWeight: 900,
            color: "white",
            opacity: title,
            transform: `translateY(${interpolate(title, [0, 1], [36, 0])}px)`,
          }}
        >
          How it was built
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 28,
            color: "rgba(255,255,255,0.6)",
            marginTop: 18,
            opacity: sub,
            transform: `translateY(${interpolate(sub, [0, 1], [18, 0])}px)`,
          }}
        >
          A Rails 8 API, a sandbox, and one Python test suite
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* ── The stack ──────────────────────────────────────────────── */

const STACK = [
  { name: "Rails 8", note: "API-only", tint: "#e05a4f" },
  { name: "Ruby 3.4", note: "the whole backend", tint: "#e05a4f" },
  { name: "PostgreSQL", note: "UUID keys · JSONB", tint: "#5b8dd6" },
  { name: "Solid Queue", note: "background jobs", tint: "#c792ea" },
  { name: "Solid Cache", note: "DB-backed cache", tint: "#c792ea" },
  { name: "Solid Cable", note: "live updates", tint: "#c792ea" },
];

export function StackScene() {
  return (
    <SceneShell eyebrow="The Stack" title="Rails 8 on Ruby 3.4">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 26,
          marginTop: 10,
        }}
      >
        {STACK.map((item, i) => (
          <StackCard key={item.name} {...item} delay={8 + i * 5} />
        ))}
      </div>

      <Callout delay={48}>
        No Redis anywhere — jobs, cache and websockets all run on Postgres
      </Callout>
    </SceneShell>
  );
}

function StackCard({ name, note, tint, delay }) {
  const t = useEnter(delay);
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 16,
        padding: "28px 30px",
        opacity: t,
        transform: `translateY(${interpolate(t, [0, 1], [26, 0])}px)`,
      }}
    >
      <div
        style={{
          width: 40,
          height: 4,
          borderRadius: 2,
          background: tint,
          marginBottom: 18,
        }}
      />
      <div
        style={{ fontFamily: SANS, fontSize: 34, fontWeight: 700, color: "white" }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 21,
          color: "rgba(255,255,255,0.5)",
          marginTop: 8,
        }}
      >
        {note}
      </div>
    </div>
  );
}

function Callout({ children, delay = 0 }) {
  const t = useEnter(delay);
  return (
    <div
      style={{
        marginTop: 34,
        display: "flex",
        justifyContent: "center",
        opacity: t,
        transform: `translateY(${interpolate(t, [0, 1], [16, 0])}px)`,
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontSize: 25,
          fontWeight: 600,
          color: "rgba(255,255,255,0.82)",
          background: "rgba(199,146,234,0.13)",
          border: "1px solid rgba(199,146,234,0.35)",
          borderRadius: 12,
          padding: "16px 34px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Request flow ───────────────────────────────────────────── */

const FLOW = [
  { label: "Browser", sub: "Run Tests" },
  { label: "Rails API", sub: "202 Accepted" },
  { label: "Solid Queue", sub: "after_create_commit" },
  { label: "TestExecutionJob", sub: "state machine" },
  { label: "Piston", sub: "sandboxed run" },
  { label: "Action Cable", sub: "live push" },
];

export function FlowScene() {
  return (
    <SceneShell eyebrow="Request Flow" title="Nothing blocks on compilation">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}
      >
        {FLOW.map((node, i) => (
          <FlowNode key={node.label} {...node} index={i} last={i === FLOW.length - 1} />
        ))}
      </div>

      <Callout delay={70}>
        The POST returns immediately — the browser never waits on a compiler
      </Callout>
    </SceneShell>
  );
}

function FlowNode({ label, sub, index, last }) {
  const t = useEnter(8 + index * 9);
  const arrow = useEnter(14 + index * 9);

  return (
    <>
      <div
        style={{
          opacity: t,
          transform: `scale(${interpolate(t, [0, 1], [0.85, 1])})`,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(199,146,234,0.32)",
          borderRadius: 14,
          padding: "24px 20px",
          width: 240,
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: SANS,
            fontSize: 22,
            fontWeight: 700,
            color: "white",
            lineHeight: 1.25,
            wordBreak: "break-word",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 16,
            color: "rgba(199,146,234,0.9)",
            marginTop: 10,
          }}
        >
          {sub}
        </div>
      </div>

      {!last && (
        <div
          style={{
            width: 46,
            height: 2,
            background: "rgba(199,146,234,0.55)",
            opacity: arrow,
            transform: `scaleX(${arrow})`,
            transformOrigin: "left center",
            flexShrink: 0,
          }}
        />
      )}
    </>
  );
}

/* ── Data model ─────────────────────────────────────────────── */

const TABLES = [
  {
    name: "User",
    fields: ["email", "password_digest", "authentication_token"],
  },
  {
    name: "Submission",
    fields: ["stage_slug", "language_slug", "code_files :jsonb", "status"],
  },
  {
    name: "TestRun",
    fields: ["status", "compile_logs", "duration_ms", "total_passed / failed"],
  },
  {
    name: "TestCaseResult",
    fields: ["case_name", "passed", "input · expected · actual", "exit_code"],
  },
];

const RELATIONS = ["has_many", "has_one", "has_many"];

export function ModelScene() {
  return (
    <SceneShell eyebrow="Data Model" title="Four tables, UUID primary keys">
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          marginTop: 26,
        }}
      >
        {TABLES.map((table, i) => (
          <TableCard
            key={table.name}
            {...table}
            relation={RELATIONS[i - 1]}
            index={i}
          />
        ))}
      </div>

      <Callout delay={62}>
        Every assertion is stored — input, expected, actual and exit code
      </Callout>
    </SceneShell>
  );
}

function TableCard({ name, fields, relation, index }) {
  const t = useEnter(8 + index * 11);
  const rel = useEnter(14 + index * 11);

  return (
    <>
      {relation && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: 118,
            opacity: rel,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 15,
              color: "rgba(199,146,234,0.9)",
              marginBottom: 8,
            }}
          >
            {relation}
          </div>
          <div
            style={{
              width: "76%",
              height: 2,
              background: "rgba(199,146,234,0.5)",
            }}
          />
        </div>
      )}

      <div
        style={{
          opacity: t,
          transform: `translateY(${interpolate(t, [0, 1], [24, 0])}px)`,
          background: "rgba(255,255,255,0.035)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14,
          overflow: "hidden",
          width: 312,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            background: "rgba(199,146,234,0.14)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            fontFamily: SANS,
            fontSize: 26,
            fontWeight: 700,
            color: "white",
          }}
        >
          {name}
        </div>
        <div style={{ padding: "16px 20px" }}>
          {fields.map((f) => (
            <div
              key={f}
              style={{
                fontFamily: MONO,
                fontSize: 17,
                color: "rgba(255,255,255,0.62)",
                padding: "6px 0",
              }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Submission model ───────────────────────────────────────── */

const SUBMISSION_RB = `class Submission < ApplicationRecord
  belongs_to :user
  has_one :test_run, dependent: :destroy

  enum :status, {
    pending: 0, compiling: 1, running: 2,
    passed: 3, failed: 4, errored: 5
  }, default: :pending

  SUPPORTED_LANGUAGES = %w[c cpp rust zig python ruby].freeze
  validates :language_slug, inclusion: { in: SUPPORTED_LANGUAGES }

  after_create_commit :enqueue_execution

  private

  def enqueue_execution
    TestExecutionJob.perform_later(id)
  end
end`;

export function SubmissionScene() {
  return (
    <SceneShell eyebrow="app/models" title="Where the pipeline starts">
      <div style={{ display: "flex", gap: 40, height: "100%" }}>
        <CodePanel
          filename="app/models/submission.rb"
          language="ruby"
          code={SUBMISSION_RB}
          highlight={[5, 6, 7, 8, 13]}
          fontSize={24}
          startAt={6}
          style={{ flex: 1 }}
        />
        <div style={{ width: 400, flexShrink: 0, paddingTop: 8 }}>
          <Note delay={30} title="Status enum">
            Six states, from pending through compiling and running to a terminal
            passed, failed or errored.
          </Note>
          <Note delay={44} title="after_create_commit">
            Enqueued after the transaction commits — the worker can never pick up
            a row that isn't visible yet.
          </Note>
        </div>
      </div>
    </SceneShell>
  );
}

function Note({ title, children, delay = 0 }) {
  const t = useEnter(delay);
  return (
    <div
      style={{
        opacity: t,
        transform: `translateX(${interpolate(t, [0, 1], [22, 0])}px)`,
        borderLeft: `3px solid ${ACCENT}`,
        paddingLeft: 22,
        marginBottom: 34,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 20,
          color: ACCENT,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 23,
          lineHeight: 1.5,
          color: "rgba(255,255,255,0.72)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Execution job ──────────────────────────────────────────── */

const JOB_RB = `class TestExecutionJob < ApplicationJob
  def perform(submission_id)
    submission = Submission.find(submission_id)
    submission.compiling!

    start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    submission.running!
    result = PistonExecutionService.execute(submission)

    test_run = submission.create_test_run!(
      status: result[:status], duration_ms: elapsed_since(start),
      total_passed: passed_count, total_failed: failed_count
    )

    result[:test_cases].each { |tc| test_run.test_case_results.create!(...) }

    ActionCable.server.broadcast("submission_#{submission.id}",
      status: submission.status, test_run_id: test_run.id)
  end
end`;

export function JobScene() {
  return (
    <SceneShell eyebrow="app/jobs" title="Driving the state machine">
      <div style={{ display: "flex", gap: 40, height: "100%" }}>
        <CodePanel
          filename="app/jobs/test_execution_job.rb"
          language="ruby"
          code={JOB_RB}
          highlight={[4, 7, 17, 18]}
          fontSize={23}
          startAt={6}
          style={{ flex: 1 }}
        />
        <div style={{ width: 372, flexShrink: 0, paddingTop: 8 }}>
          <Note delay={30} title="Monotonic clock">
            Timed with CLOCK_MONOTONIC, so a wall-clock adjustment can't corrupt
            the recorded duration.
          </Note>
          <Note delay={44} title="Action Cable">
            The result is pushed over Solid Cable — the progress bar and results
            panel update without polling.
          </Note>
        </div>
      </div>
    </SceneShell>
  );
}

/* ── API surface ────────────────────────────────────────────── */

const ROUTES = [
  ["POST", "/api/v1/submissions", "queue a run"],
  ["GET", "/api/v1/submissions/:id", "status + results"],
  ["GET/PUT", "/api/v1/workspaces/:stage/:lang", "persist code"],
  ["POST", "/api/v1/login · /signup", "bcrypt + token"],
  ["GET", "/api/v1/stages/*", "curriculum + templates"],
];

export function ApiScene() {
  return (
    <SceneShell eyebrow="API Surface" title="Token auth, persisted workspaces">
      <div style={{ display: "flex", gap: 44, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          {ROUTES.map(([verb, path, note], i) => (
            <RouteRow
              key={path}
              verb={verb}
              path={path}
              note={note}
              delay={8 + i * 7}
            />
          ))}
        </div>
        <div style={{ width: 430, flexShrink: 0 }}>
          <Note delay={26} title="has_secure_password">
            bcrypt for the password, plus a bearer token generated on user
            creation and checked on every request.
          </Note>
          <Note delay={40} title="Workspaces">
            Your code is saved per stage and per language, so nothing is lost
            between sessions.
          </Note>
          <Note delay={54} title="RSpec">
            Request specs cover every endpoint; recurring Solid Queue tasks prune
            old submissions nightly.
          </Note>
        </div>
      </div>
    </SceneShell>
  );
}

function RouteRow({ verb, path, note, delay }) {
  const t = useEnter(delay);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "17px 22px",
        marginBottom: 12,
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 11,
        opacity: t,
        transform: `translateX(${interpolate(t, [0, 1], [-20, 0])}px)`,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 17,
          fontWeight: 700,
          color: ACCENT,
          width: 92,
          flexShrink: 0,
        }}
      >
        {verb}
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 20,
          color: "rgba(255,255,255,0.88)",
          flex: 1,
        }}
      >
        {path}
      </div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 18,
          color: "rgba(255,255,255,0.42)",
        }}
      >
        {note}
      </div>
    </div>
  );
}

/* ── Piston ─────────────────────────────────────────────────── */

const PAYLOAD_RB = `{
  language: "bash",   # not "c", not "rust"
  version: "*",
  files: [
    { name: "run.sh",        content: runner_script },
    *submission.code_files,
    { name: "utils.py",      content: harness },
    { name: "stage_tests.py",content: stage_suite },
    { name: "run_stage.py",  content: json_runner }
  ],
  run_timeout: 25_000
}`;

const RUN_SH = `#!/bin/bash
set -e
export PATH=/piston/packages/rust/.../cargo/bin:$PATH

gcc -Wall -Wextra -std=c99 -o bin/c-db c-droid/*.c

python3 run_stage.py --bin ./bin/c-db --json`;

export function PistonScene() {
  return (
    <SceneShell eyebrow="Sandboxed Execution" title="Every job goes in as bash">
      <div style={{ display: "flex", gap: 34, marginTop: 6 }}>
        <CodePanel
          filename="piston_execution_service.rb — payload"
          language="ruby"
          code={PAYLOAD_RB}
          highlight={[2]}
          fontSize={22}
          startAt={6}
          style={{ flex: 1 }}
        />
        <CodePanel
          filename="run.sh — generated per submission"
          language="bash"
          code={RUN_SH}
          highlight={[5, 7]}
          fontSize={22}
          startAt={34}
          style={{ flex: 1 }}
        />
      </div>

      <Callout delay={62}>
        One payload carries the code, the toolchain command and the test harness
      </Callout>
    </SceneShell>
  );
}

/* ── Python tests ───────────────────────────────────────────── */

const TESTCASE_PY = `TestCase(
    name="invalid-meta-command-error-code",
    header="Unknown meta command returns error",
    cli_args=[],
    test_input=".foo\\n.exit\\n",
    expected="output contains an error code",
    mode="regex_error",
)`;

const TEST_STATS = [
  ["24", "test files"],
  ["20", "stages"],
  ["6", "languages"],
];

export function TestsScene() {
  return (
    <SceneShell eyebrow="tests/integration" title="One suite, two places to run">
      <div style={{ display: "flex", gap: 44, marginTop: 6 }}>
        <CodePanel
          filename="tests/integration/part1/stage1/repl_tests.py"
          language="python"
          code={TESTCASE_PY}
          highlight={[5, 6]}
          fontSize={23}
          startAt={6}
          style={{ flex: 1 }}
        />
        <div style={{ width: 452, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 30 }}>
            {TEST_STATS.map(([value, label], i) => (
              <StatTile key={label} value={value} label={label} delay={22 + i * 6} />
            ))}
          </div>
          <Note delay={44} title="Language-agnostic">
            Cases drive the compiled binary over stdin and stdout, so the suite
            doesn't care which language produced it.
          </Note>
          <Note delay={58} title="Same suite, both places">
            It runs locally through make, and inside the sandbox on every
            submission — one source of truth.
          </Note>
        </div>
      </div>
    </SceneShell>
  );
}

function StatTile({ value, label, delay }) {
  const t = useEnter(delay);
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 13,
        padding: "22px 16px",
        textAlign: "center",
        opacity: t,
        transform: `scale(${interpolate(t, [0, 1], [0.88, 1])})`,
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontSize: 46,
          fontWeight: 800,
          color: "white",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 18,
          color: "rgba(255,255,255,0.5)",
          marginTop: 10,
        }}
      >
        {label}
      </div>
    </div>
  );
}
