# Stage 9: Persistence & WHERE Clause Test Plan

This document outlines the testing strategy for the Persistence and WHERE Clause stage (Stage 9) in all language implementations.

## Stage 9 Objectives
1. Implement the `--db <path>` CLI flag to control which database file is used.
2. Ensure `db_close()` flushes all cached pages so data persists across sessions.
3. Implement WHERE clause evaluation in `execute_select`.
4. Verify cross-session data persistence.

## New CLI Behavior

```bash
./c-db                          # uses default "droid.db"
./c-db --db /tmp/mytest.db      # uses specified path
./c-db --db /tmp/mytest.db -c "select * from users;"
```

The `--db` flag can appear before or after `-c` in the argument list.

## Test Cases

All tests are in `tests/integration/python/stage9/persistence_tests.py` and run via `make test-stage9`.

### Single-Session WHERE Tests

These use REPL mode with a clean `droid.db`.

#### 1. `where-equals-int`
- **Input**: INSERT 3 rows (ids 1, 2, 3) → `select * from users where id = 2;`
- **Expected**: Output contains `bob` and `(1 rows)`. Does NOT contain `alice` or `charlie`.

#### 2. `where-no-match`
- **Input**: INSERT 2 rows → `select * from users where id = 99;`
- **Expected**: `(0 rows)`

#### 3. `where-equals-string`
- **Input**: INSERT 3 rows → `select * from users where name = 'alice';`
- **Expected**: Output contains `alice` and `(1 rows)`. Does NOT contain `bob` or `charlie`.

### Multi-Session Persistence Tests

These use `-c` mode with `--db <tmpfile>` for isolation. The test harness creates a temporary directory per test case and cleans up after.

#### 4. `persist-insert-reopen`
- **Session 1**: `./c-db --db /tmp/.../test.db -c "insert into users ...;"`
- **Session 2**: `./c-db --db /tmp/.../test.db -c "select * from users;"`
- **Expected**: Row from session 1 appears in session 2. `(1 rows)`.

#### 5. `persist-multiple-rows`
- **Session 1**: 3 INSERT commands via `-c`
- **Session 2**: `select * from users;`
- **Expected**: All 3 rows present. `(3 rows)`.

#### 6. `persist-find-after-reopen`
- **Session 1**: INSERT 1 row
- **Session 2**: `btree find 1`
- **Expected**: `Find key=1: FOUND` with row data.

#### 7. `persist-db-isolation`
- **Session 1**: INSERT into `db1.db`
- **Session 2**: SELECT from `db2.db` (different file)
- **Expected**: `(0 rows)` — db2 has no data.

#### 8. `persist-db-flag-missing-value`
- **Input**: `./c-db --db` (no path argument)
- **Expected**: Error message or non-zero exit code.

## Error Codes Reference

| Error | Meaning |
|-------|---------|
| `[ERROR:00200]` | Unknown CLI option |
| `[ERROR:00201]` | Missing argument for option |
| `[ERROR:00401]` | Table does not exist |

## How to Run

```bash
make test-stage9          # all binaries
make test-c-stage9        # C only
make test-all-stages      # all stages, all binaries
```
