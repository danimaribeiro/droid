# AGENTS

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
The tutorial models the full journey of a query from user input to durable storage.

1. User REPL
- Goal: loop input/output, parse dot commands, route SQL/meta commands.
- Test focus: CLI behavior, .exit, error reporting, non-crash guarantees.

2. SQL Parser
- Goal: tokenize input, validate syntax, build AST/statement representation.
- Test focus: valid/invalid syntax, token boundaries, parser error messages.

3. Planner and Executor
- Goal: transform AST into executable plan and process rows through plan nodes.
- Test focus: plan correctness, simple scans/inserts, WHERE evaluation behavior.

4. Row Serialization
- Goal: map logical rows to byte layout and back.
- Test focus: serialize/deserialize round-trip, offsets, fixed/variable field limits.

5. B-Tree Engine
- Goal: sorted key storage, efficient lookup, split and rebalance behavior.
- Test focus: insert order invariants, search correctness, leaf/internal split cases.

6. Pager Cache
- Goal: manage in-memory pages, dirty tracking, and eviction policy.
- Test focus: cache hit/miss behavior, dirty page lifecycle, eviction correctness.

7. Disk and WAL
- Goal: durability and crash recovery with write-ahead logging.
- Test focus: WAL-before-data guarantees, checkpoint flow, restart recovery.

Stage progression rule:
- At each stage, update the expected contract and move tests from "not implemented error" to "implemented behavior".
- Always keep backward-stable integration checks for previous completed stages.

## Long-Term Objective
This repository will evolve into a step-by-step tutorial where each stage has automatic tests that validate whether the submitted code is correct.

Target outcome for future platform integration:
- participants implement code in one language
- tests run automatically against submissions
- output is clear and educational (input, expected, actual, exit code, reason)

## Current Scope (Stage 1: REPL)
- focus on integration tests for CLI behavior
- keep behavior contract explicit and versioned by stage
- prefer stable output patterns (regex) to reduce brittle failures

## Testing Strategy
- use Python integration tests under tests/integration/python
- centralize command execution helpers in utils.py
- keep test cases declarative and language-agnostic
- each test output should include:
  - mini header (1-2 lines explanation)
  - input
  - expected
  - actual
  - exit code
  - pass/fail and reason

## Repository Conventions
- one main source file per language project at this stage
- root Makefile orchestrates build/run/test commands
- default test target should execute the Python Stage 1 suite

## Rules for Future Sessions
1. Preserve cross-language parity whenever possible.
2. Update tests first when stage contracts change.
3. Prefer additive changes; avoid unnecessary refactors.
4. Keep outputs deterministic to support CI and web rendering.
5. Document contract changes in tests/integration/STAGE1_REPL_TEST_PLAN.md (or next stage plan file).

## Next Planned Evolutions
1. Add JSON output mode to the Python test runner for web consumption.
2. Introduce stage-specific test modules (stage1, stage2, ...).
3. Add per-language allowlist/skip rules when a toolchain is missing.
4. Expand from REPL to parser/planner/storage tests as stages progress.
5. Keep each stage tied to tutorial sections: Stage Objective, Conceptual Algorithms, and Implementation Checklist.
