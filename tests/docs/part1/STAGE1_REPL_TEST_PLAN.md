# Stage 1: User REPL Test Plan

This document outlines the testing strategy, contracts, and behaviors expected for the User REPL (Stage 1) in all language implementations.

## Stage 1 Objectives
1. Implement an interactive Command-Line Interface (REPL) loop that displays a prompt (e.g. `droid> `) and accepts user input.
2. Parse dot/meta commands (`.help`, `.exit`) and route non-dot inputs to the SQL engine.
3. Support non-interactive execution via the `-c "<sql>"` CLI flag.
4. Ensure non-crash guarantees (no segfaults / exit code 139) on empty lines, long lines, or unexpected EOF.

## Test Cases

All test cases are implemented in `tests/integration/python/stage1/repl_tests.py` and run via `make test-stage1`.

### 1. `help-command-works`
- **Input**: `.help`
- **Expected Output**: Displays available meta commands. Must contain `Available commands:` header and list `.exit` and `.help`.

### 2. `exit-command-status`
- **Input**: `.foo` then `.exit`
- **Expected Output**: Returns an error code for `.foo`, displays prompt, and terminates cleanly with exit code 0.

### 3. `invalid-meta-command-error-code`
- **Input**: `.foo`
- **Expected Output**: Rejects unknown meta command with an error code matching `ERR_CODE_REGEX` (e.g. `[ERROR:00102]`).

### 4. `empty-line-no-crash`
- **Input**: Empty line `\n` followed by `.exit`
- **Expected Output**: Ignores empty input, displays prompt, and exits without crashing.

### 5. `trimmed-help-with-spaces`
- **Input**: Leading/trailing spaces `   .help   `
- **Expected Output**: Trims whitespace and executes `.help` correctly.

### 6. `sql-select-unimplemented-error-code`
- **Input**: `select 1;`
- **Expected Output**: While SQL execution is unimplemented in Stage 1, returns error code matching `ERR_CODE_REGEX` (e.g. `[ERROR:00101]`).

### 7. `mixed-session-order`
- **Input**: `.foo` -> `select 1;` -> `.exit`
- **Expected Output**: Evaluates commands sequentially without state corruption.

### 8. `eof-no-crash`
- **Input**: EOF (ctrl+d / empty stream) on stdin
- **Expected Output**: Handles EOF gracefully without crashing.

### 9. `long-line-no-crash`
- **Input**: 4096-character input string
- **Expected Output**: Buffer safety check: handles long lines without stack/heap buffer overflow or segfault.

### 10. `cli-c-select-unimplemented-error-code`
- **Input**: CLI invocation with `-c "select 1;"`
- **Expected Output**: Executes SQL command in one-shot mode and returns expected output.

### 11. `cli-c-missing-argument-fails`
- **Input**: CLI invocation with `-c` without an argument
- **Expected Output**: Returns non-zero exit code indicating CLI usage error.

## Error Codes Reference

A suggested standard for Stage 1 error codes:
- `[ERROR:00101]` - SQL execution not implemented yet
- `[ERROR:00102]` - Unrecognized dot/meta command

## Repository Rules Followed
- All test cases run against binary builds (`bin/c-db`, `bin/cpp-db`, `bin/rust-db`, `bin/zig-db`).
- Prompt customization can be passed via environment variable `PROMPT_REGEX`.
