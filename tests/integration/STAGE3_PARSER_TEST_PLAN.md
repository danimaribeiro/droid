# Stage 3: SQL Parser Test Plan

This document outlines the testing strategy, contracts, and behaviors expected for the SQL Parser (Stage 3) in all language implementations.

## Stage 3 Objectives
1. Build a parser to validate syntax against a simple SQL grammar using the output of Stage 2 (Lexer).
2. Validate values against their column constraints (e.g., maximum string length, numeric types).
3. Extract the statement into an internal representation (AST/Statement struct).

## Test Cases

All test cases are implemented in `tests/integration/python/stage3/parser_tests.py` and run via `make test-stage3`.

### 1. `ast-insert-valid`
- **Input**: `ast insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');`
- **Expected Output**:
  ```
  Statement: INSERT
  Table: users
  Values: [1, 'danimar', 'danimar@email.com']
  ```

### 2. `ast-select-valid`
- **Input**: `ast select * from users;`
- **Expected Output**:
  ```
  Statement: SELECT
  Table: users
  Columns: [*]
  ```

### 3. `ast-select-where`
- **Input**: `ast select name, email from users where name = 'alice';`
- **Expected Output**:
  ```
  Statement: SELECT
  Table: users
  Columns: [name, email]
  Where: name = 'alice'
  ```

### 4. `ast-update-where`
- **Input**: `ast update users set name = 'bob' where id = 1;`
- **Expected Output**:
  ```
  Statement: UPDATE
  Table: users
  Columns: [name]
  Values: ['bob']
  Where: id = 1
  ```

### 5. `ast-update-no-where`
- **Input**: `ast update users set email = 'bulk@test.com';`
- **Expected Output**:
  ```
  Statement: UPDATE
  Table: users
  Columns: [email]
  Values: ['bulk@test.com']
  ```

### 6. `ast-delete-where`
- **Input**: `ast delete from users where id = 1;`
- **Expected Output**:
  ```
  Statement: DELETE
  Table: users
  Where: id = 1
  ```

### 7. `ast-delete-no-where`
- **Input**: `ast delete from users;`
- **Expected Output**:
  ```
  Statement: DELETE
  Table: users
  ```

### 8. `ast-insert-missing-args`
- **Input**: `ast insert into users (id, name, email) values (1, 'danimar');`
- **Expected Output**: Syntax error code `[ERROR:00302]`.

### 9. `ast-insert-invalid-id`
- **Input**: `ast insert into users (id, name, email) values (abc, 'danimar', 'danimar@email.com');`
- **Expected Output**: Syntax error code `[ERROR:00302]`.

### 10. `ast-unrecognized-sql`
- **Input**: `ast truncate from users;`
- **Expected Output**: Unrecognized keyword error code `[ERROR:00301]`.

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
