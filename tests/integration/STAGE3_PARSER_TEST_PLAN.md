# Stage 3: SQL Parser Test Plan

This document outlines the testing strategy, contracts, and behaviors expected for the SQL Parser (Stage 3) in all language implementations.

## Stage 3 Objectives
1. Build a parser to validate syntax against a simple SQL grammar using the output of Stage 2 (Lexer).
2. Validate values against their column constraints (e.g., maximum string length, numeric types).
3. Extract the statement into an internal representation (AST/Statement struct).

## Test Cases

All test cases are implemented in `tests/integration/python/stage3/parser_tests.py` and run via `make test-stage3`.

### 1. `explain-insert-valid`
- **Input**: `explain insert into users values (1, 'danimar', 'danimar@email.com');`
- **Expected Output**: The parser must successfully parse the statement and output the AST representation:
  ```
  [AST] Statement: INSERT
  [AST] Table: users
  [AST] Values: [1, 'danimar', 'danimar@email.com']
  ```
- **Why `explain`?**: Since execution (Stage 3) is not yet implemented, `explain` acts as a debug flag to prove the parser extracted the correct arguments.

### 2. `explain-select-valid`
- **Input**: `explain select * from users;`
- **Expected Output**:
  ```
  [AST] Statement: SELECT
  [AST] Table: users
  [AST] Columns: [*]
  ```

### 3. `insert-execution-unimplemented`
- **Input**: `insert into users values (1, 'danimar', 'danimar@email.com');` (without `explain`)
- **Expected Output**: The parser succeeds, but execution fails.
  - Matches regex: `(\[ERROR:00101\]|ERR_.*E0101)` (Execution not implemented)

### 4. `explain-insert-missing-args`
- **Input**: `explain insert into users values (1, 'danimar');`
- **Expected Output**: Syntax error indicating missing arguments.
  - Matches regex: `(\[ERROR:\d+\]|ERR_.*)`

### 5. `explain-insert-invalid-id`
- **Input**: `explain insert into users values (abc, 'danimar', 'danimar@email.com');`
- **Expected Output**: Syntax error indicating invalid ID type.
  - Matches regex: `(\[ERROR:\d+\]|ERR_.*)`

### 6. `explain-insert-name-too-long`
- **Input**: `explain insert into users values (1, 'this_is_a_very_long_name_that_exceeds_32_characters', 'email@test.com');`
- **Expected Output**: Syntax/Validation error indicating the string exceeds constraints.
  - Matches regex: `(\[ERROR:\d+\]|ERR_.*)`

### 7. `explain-unrecognized-sql`
- **Input**: `explain delete from users;`
- **Expected Output**: Unrecognized keyword error.
  - Matches regex: `(\[ERROR:\d+\]|ERR_.*)`

## Error Codes Reference

While the exact error code digit sequences can be chosen by the implementation, they must match the `ERR_CODE_REGEX` (e.g. `[ERROR:xxxxx]`). A suggested standard for Stage 3 is:

- `[ERROR:00101]` - Execution not implemented yet
- `[ERROR:00301]` - Unrecognized keyword (Syntax Error)
- `[ERROR:00302]` - Missing or extra arguments (Syntax Error)
- `[ERROR:00303]` - Invalid type (e.g., expected int, got string)
- `[ERROR:00304]` - String too long (Constraint Violation)

## Repository Rules Followed
- Output format for successful `explain` uses stable strings prefixed with `[AST]`.
- Tests do not rely on exact whitespace or exact error text, just the error code presence and standard AST strings.
- Integration tests remain language-agnostic and are invoked identically.
