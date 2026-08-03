# droid

Multi-language database internals playground following the Database Internals tutorial pipeline.

📚 **Tutorial**: [https://danimaribeiro.github.io/droid/](https://danimaribeiro.github.io/droid/)

## Languages
- c-droid
- cpp-droid
- rust-droid
- zig-droid

## Current Status
- **Part 1 (Core Engine)**: Stages 1 through 8 are implemented in C.
- Tests are contract-first and strictly validate tutorial milestones.
- Placeholder binaries are expected to fail until their respective stage behavior is implemented.

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
make test-c-stage2
# ... up to stage12
```

Notes:
- `make test` does not compile automatically.
- test targets first verify binaries exist and print build guidance when missing.
- Test runner output is compact for pass cases and detailed for fail cases.

## Repository Structure
- `tests/docs/`: Stage specification documents (Test Plans) organized by Part.
- `tests/integration/`: Python test suites validating each stage's contract.
- `docs-site/`: Next.js web application for rendering the tutorial dashboard.
