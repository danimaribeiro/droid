# Stage 8: B-Tree Splits & Internal Nodes Test Plan

This document outlines the testing strategy for the B-Tree Splits and Internal Nodes stage (Stage 8) in all language implementations.

## Stage 8 Objectives
1. Detect when a leaf node is full (exceeds max cells per page).
2. Split a full leaf into two halves, distributing cells evenly.
3. Create internal (non-leaf) nodes with child pointers and separator keys.
4. Implement the `btree structure` debug command to visualize tree topology.

## Debug Command: `btree structure`

### Output Format Contract

Single leaf (no splits):
```
[BTREE] Tree depth: 1
[BTREE] LEAF (page=0 cells=3 keys=[1,2,3])
```

After a split:
```
[BTREE] Tree depth: 2
[BTREE] INTERNAL (page=2 keys=[4])
[BTREE]   LEAF (page=0 cells=4 keys=[1,2,3,4])
[BTREE]   LEAF (page=1 cells=3 keys=[5,6,7])
```

## Test Cases

All tests are in `tests/integration/python/stage8/btree_split_tests.py` and run via `make test-stage8`.

Each test case deletes `droid.db` before running.

The split threshold is configured to 10 rows in our evaluation suite (`SPLIT_THRESHOLD = 10`). Although a 4096-byte page natively holds up to ~63 compact 64-byte cells (4-byte key + 60-byte row), enforcing a test split threshold of 10 allows our integration runner to test deep internal node creation without requiring massive insertion sequences. Inserting 10 rows guarantees at least one split.

### 1. `btree-no-split-under-limit`
- **Input**: INSERT 3 rows → `btree structure`
- **Expected**: `Tree depth: 1`, `LEAF` present, `INTERNAL` NOT present

### 2. `btree-split-on-overflow`
- **Input**: INSERT 10 rows → `btree structure`
- **Expected**: `Tree depth: 2`

### 3. `btree-internal-node-created`
- **Input**: INSERT 10 rows → `btree structure`
- **Expected**: `INTERNAL` present in output

### 4. `btree-split-has-two-leaves`
- **Input**: INSERT 10 rows → `btree structure`
- **Expected**: At least 2 occurrences of `LEAF` in output

### 5. `btree-find-after-split`
- **Input**: INSERT 10 rows → `btree find 1`, `btree find 5`, `btree find 10`
- **Expected**: All return `FOUND`

### 6. `btree-select-after-split`
- **Input**: INSERT 10 rows → `select * from users;`
- **Expected**: `(10 rows)` in output

### 7. `btree-insert-order-after-split`
- **Input**: INSERT 10 rows in **reverse order** → `select * from users;`
- **Expected**: `(10 rows)` and rows in ascending key order

### 8. `btree-multi-split`
- **Input**: INSERT 30 rows → `btree structure`
- **Expected**: `INTERNAL` and `LEAF` both present (3+ leaf nodes)

## Leaf Capacity Reference

| Cell size | Page size | Header | Max cells/leaf |
|-----------|-----------|--------|---------------|
| 64 bytes | 4096 bytes | ~8 bytes | ~63 (Test threshold: 10) |

## How to Run

```bash
make test-stage8          # all binaries
make test-c-stage8        # C only
```
