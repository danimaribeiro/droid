# droid

Multi-language database internals playground following the Database Internals tutorial pipeline.

## Languages
- c-droid
- cpp-droid
- rust-droid
- zig-droid

## Current Stage
Stage 1: User REPL integration contract and test harness.

Current Stage 1 status:
- tests are contract-first and intentionally strict
- placeholder binaries are expected to fail until REPL behavior is implemented

## Build
```bash
make all
```

Or compile one language at a time:
```bash
make build-c
make build-cpp
make build-rust
make build-zig
```

## Run (one by one)
```bash
make run-c
make run-cpp
make run-rust
make run-zig
```

## Tests
```bash
make test
make test-stage1
make test-c-stage1
make test-cpp-stage1
make test-rust-stage1
make test-zig-stage1
make test-stage2
make test-stage3
make test-all-stages
```

Notes:
- `make test` does not compile automatically.
- test targets first verify binaries exist and print build guidance when missing.
- Stage 1 runner output is compact for pass cases and detailed for fail cases.

## Tutorial Reference
- https://database-builder-tutorial.ai.studio/llms.txt

## Notes
- Stage 1 tests are Python integration tests under tests/integration/python.
- Stage 2 and Stage 3 test modules are scaffolded for future implementation.
- Stage 1 includes CLI `-c` contract checks for one-shot execution mode.
