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
Implementation order is bottom-up (dependencies first), not conceptual top-down.

1. User REPL ✅
- Goal: loop input/output, parse dot commands, route SQL/meta commands.
- Test focus: CLI behavior, .exit, error reporting, non-crash guarantees.

2. SQL Lexer ✅
- Goal: tokenize input into keywords, identifiers, symbols, and values.
- Test focus: valid/invalid tokens, error on unexpected characters, bracket output format.
- Debug command: `tokenize <sql>`

3. SQL Parser ✅
- Goal: validate syntax, build AST/statement representation.
- Test focus: valid/invalid syntax, AST dump format, error codes.
- Debug command: `ast <sql>`

4. Row Serialization
- Goal: map logical rows (id, name, email) to a fixed 508-byte buffer and back.
- Test focus: serialize/deserialize round-trip, field offsets, edge cases (zero id, empty strings).
- Debug command: `serialize <insert_sql>`

5. The Pager & Buffer Pool
- Goal: manage 4KB pages as the unit of disk I/O, in-memory cache.
- Test focus: page allocation, cache hit/miss, out-of-bounds errors.
- Debug commands: `pager status`, `pager alloc`, `pager get <N>`

6. B-Tree Leaf Node & INSERT Execution
- Goal: define leaf node byte layout, insert cells, wire INSERT end-to-end.
- Test focus: dump empty/populated nodes, cell count, key presence, no errors on INSERT.
- Debug command: `btree dump [page]`

7. B-Tree Search & SELECT Execution
- Goal: binary search in leaf, sorted insertion, cursor scan for SELECT.
- Test focus: find existing/missing keys, sorted cell order, SELECT output with headers/count.
- Debug command: `btree find <key>`

8. B-Tree Splits & Internal Nodes
- Goal: handle leaf overflow, split into two halves, create internal nodes.
- Test focus: split triggers, tree depth increase, find/select after split, multi-split.
- Debug command: `btree structure`

9. Persistence & WHERE Clause
- Goal: data survives across sessions, WHERE filtering, --db flag for file control.
- Test focus: cross-session persistence, WHERE equals on int/string, db file isolation.
- New CLI flag: `--db <path>`

10. Query Planner & Executor (Volcano Model)
- Goal: transform AST into execution plan, choose IndexScan vs SeqScan, pull-based row iteration.
- Test focus: explain plan output, IndexScan on primary key, SeqScan on non-key, correct results.
- Debug command: `explain <sql>`

11. WAL & Crash Recovery (future)
- Goal: write-ahead logging for durability and crash recovery.
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

## Current Scope
- Stages 1-3 (REPL, Lexer, Parser) are implemented and tested.
- Stages 4-10 have test infrastructure ready; C implementation is in progress.
- Stage 11 (WAL) is a future evolution.
- Each stage has a test plan document under `tests/integration/STAGE<N>_*_TEST_PLAN.md`.
- Each stage has a Python test module under `tests/integration/python/stage<N>/`.

## Testing Strategy
- use Python integration tests under tests/integration/python
- centralize command execution helpers in utils.py
- keep test cases declarative and language-agnostic
- keep stage modules separated (stage1 through stage10)
- stages 5+ clean up droid.db before each test case for isolation
- stage 9 uses tempfile-based --db paths for multi-session tests
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
5. Document contract changes in the corresponding `tests/integration/STAGE<N>_*_TEST_PLAN.md`.

## Next Planned Evolutions
1. Add JSON output mode to the Python test runner for web consumption.
2. Add per-language allowlist/skip rules when a toolchain is missing.
3. Implement C code for stages 4-10 to pass all tests.
4. Keep each stage tied to tutorial sections: Stage Objective, Conceptual Algorithms, and Implementation Checklist.
5. Stage 11: WAL & crash recovery.
