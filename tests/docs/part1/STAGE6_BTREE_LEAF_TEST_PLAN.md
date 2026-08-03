# Stage 6: B-Tree Leaf Node & INSERT Execution Test Plan

This document outlines the testing strategy for the B-Tree Leaf Node and INSERT Execution stage (Stage 6) in all language implementations.

## Stage 6 Objectives
1. Define the byte layout of a leaf node within a 4KB page (header + cells).
2. Implement `btree_insert` to add cells into a leaf page.
3. Wire the executor so `INSERT INTO users ...` works end-to-end (AST → serialize → btree → pager).
4. Implement the `btree dump` debug command to inspect node structure.

## Debug Command: `btree dump [page_num]`

Dumps the structure of a B-tree node page. If `page_num` is omitted, dumps the root page (page 0).

### Output Format Contract

```
[BTREE] Page 0: type=LEAF num_cells=3
[BTREE]   Cell 0: key=1 (60 bytes)
[BTREE]   Cell 1: key=2 (60 bytes)
[BTREE]   Cell 2: key=3 (60 bytes)
```

Empty page:
```
[BTREE] Page 0: type=LEAF num_cells=0
```

## Test Cases

All tests are in `tests/integration/python/stage6/btree_leaf_tests.py` and run via `make test-stage6`.

Each test case deletes `droid.db` before running.

### 1. `btree-dump-empty`
- **Input**: `btree dump 0` on fresh database
- **Expected**: `[BTREE]`, `type=LEAF`, `num_cells=0`

### 2. `btree-insert-one-dump`
- **Input**: INSERT 1 row → `btree dump 0`
- **Expected**: `num_cells=1`, `key=1`

### 3. `btree-insert-three-dump`
- **Input**: INSERT 3 rows (ids 1, 2, 3) → `btree dump 0`
- **Expected**: `num_cells=3`, `key=1`, `key=2`, `key=3`

### 4. `btree-insert-custom-key`
- **Input**: INSERT id=42 → `btree dump 0`
- **Expected**: `key=42`

### 5. `btree-insert-no-error`
- **Input**: INSERT 1 row
- **Expected**: No `[ERROR:` in output

### 6. `btree-node-type-leaf`
- **Input**: INSERT 1 row → `btree dump 0`
- **Expected**: `[BTREE] Page 0:` and `type=LEAF`

### 7. `btree-dump-default`
- **Input**: `btree dump` without argument
- **Expected**: `[BTREE] Page 0:` and `type=LEAF` (defaults to dumping root page 0)

### 8. `btree-dump-out-of-bounds`
- **Input**: `btree dump 999`
- **Expected**: `ERROR` in output (preventing unallocated node access without crashing)

## Node Layout Reference

| Component | Size |
|-----------|------|
| Node header (type + num_cells) | ~8 bytes |
| Cell (key + row payload) | 4 + 60 = 64 bytes |
| Max cells per 4KB leaf | ~63 |

> **Note**: At this stage, cells may be stored in insertion order. Sorted insertion is Stage 7.

## How to Run

```bash
make test-stage6          # all binaries
make test-c-stage6        # C only
```
