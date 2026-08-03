# Stage 7: B-Tree Search & SELECT Execution Test Plan

This document outlines the testing strategy for the B-Tree Search and SELECT Execution stage (Stage 7) in all language implementations.

## Stage 7 Objectives
1. Implement binary search within a leaf node to find a key efficiently.
2. Maintain sorted key order when inserting cells into a leaf.
3. Implement `execute_select` — cursor scan through leaf cells, deserialize each row, and print formatted output.
4. Implement the `btree find` debug command.

## Debug Command: `btree find <key>`

### Output Format Contract

Found:
```
[BTREE] Find key=1: FOUND (page=0 cell=0)
[BTREE] Row: id=1 name='danimar' email='danimar@email.com'
```

Not found:
```
[BTREE] Find key=99: NOT_FOUND
```

## SELECT Output Format Contract

```
id | name | email
1 | danimar | danimar@email.com
2 | alice | alice@test.com
(2 rows)
```

Empty result:
```
(0 rows)
```

## Test Cases

All tests are in `tests/integration/python/stage7/btree_search_tests.py` and run via `make test-stage7`.

Each test case deletes `droid.db` before running.

### 1. `btree-find-existing`
- **Input**: INSERT (1, 'danimar', ...) → `btree find 1`
- **Expected**: `Find key=1: FOUND`, `id=1`, `danimar`

### 2. `btree-find-missing`
- **Input**: `btree find 99` on empty/populated tree
- **Expected**: `Find key=99: NOT_FOUND`

### 3. `btree-sorted-insert`
- **Input**: INSERT keys 3, 1, 2 → `btree dump 0`
- **Expected**: `Cell 0: key=1`, `Cell 1: key=2`, `Cell 2: key=3` (sorted by cell position)

### 4. `btree-find-after-multiple`
- **Input**: INSERT 3 rows → `btree find 1`, `btree find 2`, `btree find 3`
- **Expected**: All three return `FOUND`

### 5. `select-after-insert`
- **Input**: INSERT 2 rows → `select * from users;`
- **Expected**: Both row names in output, `(2 rows)`

### 6. `select-empty-table`
- **Input**: `select * from users;` on fresh database
- **Expected**: `(0 rows)`

### 7. `select-row-count`
- **Input**: INSERT 3 rows → `select * from users;`
- **Expected**: `(3 rows)`

### 8. `select-column-headers`
- **Input**: INSERT 1 row → `select * from users;`
- **Expected**: `id | name | email` header line

### 9. `btree-duplicate-key-error`
- **Input**: INSERT key=1 twice
- **Expected**: `ERROR` in output (duplicate key violation)

## Transition Note

> At this stage, the Stage 3 test case `insert-execution-unimplemented` (which expects `[ERROR:00101]` for INSERT) will need to be updated or removed, since INSERT now executes successfully.

## How to Run

```bash
make test-stage7          # all binaries
make test-c-stage7        # C only
```
