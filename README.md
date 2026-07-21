# droid

Multi-language database internals playground following the Database Internals tutorial pipeline.

## Languages
- c-droid
- cpp-droid
- rust-droid
- zig-droid

## Current Stage
Stage 1: User REPL integration contract and test harness.

## Build
```bash
make all
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
make test-stage2
make test-stage3
make test-all-stages
```

## Tutorial Reference
- https://database-builder-tutorial.ai.studio/llms.txt

## Notes
- Stage 1 tests are Python integration tests under tests/integration/python.
- Stage 2 and Stage 3 test modules are scaffolded for future implementation.
