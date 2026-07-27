# Stage 2: SQL Lexer Test Plan

This document outlines the testing strategy, contracts, and behaviors expected for the SQL Lexer (Stage 2) in all language implementations.

## Stage 2 Objectives
1. Implement a tokenizer to break input strings into SQL keywords, identifiers, symbols, and values.
2. Gracefully handle memory allocation and unexpected characters without crashing the REPL.

## Test Cases

All test cases are implemented in `tests/integration/python/stage2/lexer_tests.py` and run via `make test-stage2`.

### 1. `tokenize-select-valid`
- **Input**: `tokenize select * from users;`
- **Expected Output**: The lexer must successfully tokenize the statement and output the tokens line by line in the exact bracket format:
  ```
  [KEYWORD_SELECT - select]
  [SYMBOL - *]
  [KEYWORD_FROM - from]
  [IDENTIFIER - users]
  [SYMBOL - ;]
  ```

### 1b. Outras Queries Suportadas e Validadas
Os testes também incluem validação para:
- `UPDATE`: `tokenize UPDATE users SET name = 'danimar' WHERE id = 1;`
- `DELETE`: `tokenize delete from users where id = 1;`
- `SELECT com WHERE`: `tokenize select * from users where id = 1;`
- Suporte a maiúsculas: `tokenize SELECT * FROM users;`

### 2. `tokenize-insert-valid`
- **Input**: `tokenize insert into users (id, name) values (1, 'danimar');`
- **Expected Output**:
  ```
  [KEYWORD_INSERT - insert]
  [KEYWORD_INTO - into]
  [IDENTIFIER - users]
  [SYMBOL - (]
  [IDENTIFIER - id]
  [SYMBOL - ,]
  [IDENTIFIER - name]
  [SYMBOL - )]
  [KEYWORD_VALUES - values]
  [SYMBOL - (]
  [NUMBER - 1]
  [SYMBOL - ,]
  [STRING - danimar]
  [SYMBOL - )]
  [SYMBOL - ;]
  ```

### 3. `tokenize-missing-quote`
- **Input**: `tokenize insert into users values (1, 'danimar`
- **Expected Output**: Syntax error indicating missing closing quote.
  - Matches regex: `(\[ERROR:\d+\]|ERR_.*)`
  - Should print `Syntax error in command`

### 4. `tokenize-invalid-character`
- **Input**: `tokenize select # from users;`
- **Expected Output**: Syntax error indicating unexpected character.
  - Matches regex: `(\[ERROR:\d+\]|ERR_.*)`
  - Should print `Syntax error in command`

## Repository Rules Followed
- Output format for successful `tokenize` uses stable strings prefixed with brackets `[TYPE - value]`.
- Integration tests remain language-agnostic and are invoked identically.
