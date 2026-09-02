# AGENTS

## Commands

```bash
make all                 # build every language implementation (c/cpp/rust/zig)
make build-c             # build a single language (build-cpp, build-rust, build-zig)
make run-c               # build + run a single language's REPL (run-cpp, run-rust, run-zig)

make test                # default: Python Stage 1 suite (does NOT compile automatically)
make test-stage9         # run a specific stage's tests across all languages
make test-c-stage1       # run one language's tests for one stage
make test-all-stages     # run everything (first checks binaries exist, prints build hints if not)
```

Other components live alongside the language playground (see Repository Layout) and have
their own tooling:

```bash
cd backend && bin/rails test   # Rails 8 API (RSpec available too: bin/rspec)
cd e2e && npm test              # Playwright end-to-end tests (npm run test:ui for UI mode)
cd docs-site && npm run dev     # Next.js tutorial dashboard — has its own AGENTS.md/CLAUDE.md
cd video && npm run render      # showcase video — has its own README (prerequisites, asset order)
```

## Repository Layout

- `c-droid/`, `cpp-droid/`, `rust-droid/`, `zig-droid/` — the four per-language playground
  implementations this file's curriculum content is about.
- `tests/docs/part<N>/STAGE<M>_*_TEST_PLAN.md` — stage specs; `tests/integration/` — the
  Python integration test suites that enforce them (see Testing Strategy below).
- `backend/` — a Rails 8 API (Solid Queue/Cache/Cable, Postgres) — supports the "future
  platform integration" objective (running submissions, presumably alongside `piston/`).
- `piston/` — Docker setup for a Piston-style sandboxed code execution engine.
- `e2e/` — Playwright end-to-end tests, plus `record-showcase.js`, which drives the running
  app to capture the stills and screencast the showcase video uses.
- `docs-site/` — Next.js app rendering the tutorial dashboard (danimar.dev/droid); has its
  own `AGENTS.md`/`CLAUDE.md` — read that when working inside it.
- `video/` — Remotion project for the showcase video (product walkthrough + a section on how
  the backend works). Assets are generated, not committed; `video/README.md` covers the
  prerequisites and the order the scripts run in — read that before touching it.

## Project Mission
Build a multi-language database internals playground with one implementation per language:
- c-droid
- cpp-droid
- rust-droid
- zig-droid

The project follows the Database Internals tutorial pipeline stage by stage.

Tutorial reference:
- https://database-builder-tutorial.ai.studio/llms.txt
- This file is the curriculum context and should guide explanations, implementation priorities, and test contracts.

## Tutorial Pipeline (Source of Truth)
The tutorial models the full journey of a query from user input to durable storage, divided into multiple parts.
Implementation order is bottom-up (dependencies first), not conceptual top-down.

### Part 1 (Core Engine)
1. User REPL ✅
2. SQL Lexer ✅
3. SQL Parser ✅
4. Row Serialization ✅
5. The Pager & Buffer Pool ✅
6. B-Tree Leaf Node & INSERT Execution ✅
7. B-Tree Search & SELECT Execution ✅
8. B-Tree Splits & Internal Nodes ✅
9. Persistence & WHERE Clause
10. Query Planner & Executor (Volcano Model)
11. Index Scan
12. Delete & Update

### Part 2 (Advanced Storage & Transactions)
1. WAL & Crash Recovery
2. Transaction Commit
3. Transaction Rollback
4. Create Table
5. Schema Validation
6. Varlen Serialization (VARCHAR)
7. Slotted Page
8. Varlen B-Tree

*(Further parts include advanced querying, joins, lock manager, etc.)*

Stage progression rule:
- At each stage, update the expected contract and move tests from "not implemented error" to "implemented behavior".
- Always keep backward-stable integration checks for previous completed stages.

## Long-Term Objective
This repository will evolve into a step-by-step tutorial where each stage has automatic tests that validate whether the submitted code is correct.

Target outcome for future platform integration:
- participants implement code in one language
- tests run automatically against submissions
- output is clear and educational (input, expected, actual, exit code, reason)

## Current Scope
- Tests are split into:
  - Documentation/Specs: `tests/docs/part<N>/STAGE<M>_*_TEST_PLAN.md`
  - Executable Integration Tests: `tests/integration/part<N>/stage<M>/`
- Part 1: Stages 1-8 are fully implemented in C and passing all tests.
- Part 1: Stages 9-12 have test infrastructure ready; C implementation is in progress.
- Part 2+: Scaffolded and planned.

## Testing Strategy
- use Python integration tests under `tests/integration/`
- centralize command execution helpers in `tests/integration/utils.py`
- keep test cases declarative and language-agnostic
- keep stage modules separated by part and stage
- stages 5+ clean up `droid.db` before each test case for isolation
- stage 9 uses tempfile-based `--db` paths for multi-session tests
- each test output should include:
  - mini header (1-2 lines explanation)
  - input
  - expected
  - actual
  - exit code
  - pass/fail and reason
- output policy:
  - PASS: compact one-line status (`binary + case + PASS`)
  - FAIL: full diagnostic block
- stages 4-9 use `must_contain` / `must_not_contain` substring matching

## Repository Conventions
- one main source file per language project at this stage
- root Makefile orchestrates build/run/test commands
- default test target should execute the Python Stage 1 suite
- test targets should not compile automatically; they should validate binary presence first and provide build hints

## Rules for Future Sessions
1. Preserve cross-language parity whenever possible.
2. Update tests first when stage contracts change.
3. Prefer additive changes; avoid unnecessary refactors.
4. Keep outputs deterministic to support CI and web rendering.
5. Document contract changes in the corresponding `tests/docs/part<N>/STAGE<M>_*_TEST_PLAN.md`.

## Next Planned Evolutions
1. Add JSON output mode to the Python test runner for web consumption.
2. Add per-language allowlist/skip rules when a toolchain is missing.
3. Implement C code for Part 1 Stages 9-12.
4. Keep each stage tied to tutorial sections: Stage Objective, Conceptual Algorithms, and Implementation Checklist.
