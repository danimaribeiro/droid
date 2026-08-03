# Stage 9: B+Tree Internal Node Splits Test Plan

This document outlines the testing strategy for the Internal Node Splits stage (Stage 9) in all language implementations.

## Stage 9 Objectives
1. Implement recursive internal node splitting.
2. Ensure the `INTERNAL_NODE_MAX_KEYS` boundary is enforced.
3. Support tree growth to depth 3 and beyond.
4. Verify that `btree find` and `SELECT` work seamlessly across deep trees.

## Test Cases

All tests are in `tests/integration/python/stage9/btree_internal_split_tests.py` and run via `make test-stage9`.

### 1. `internal-node-overflow`
- **Input**: Insert enough sequential records to overflow the root internal node (e.g. 500+ records depending on `INTERNAL_NODE_MAX_KEYS`).
- **Expected**: No crashes. The tree successfully splits the root and depth increases.

### 2. `btree-structure-depth-3`
- **Input**: Insert sufficient records to force tree depth to 3 → `btree structure`
- **Expected**: Output displays `[BTREE] Tree depth: 3`, with two levels of `INTERNAL` nodes correctly linking to `LEAF` nodes.

### 3. `select-all-after-internal-split`
- **Input**: Insert 1000 records → `select * from users;`
- **Expected**: All 1000 rows are returned in ascending order. Ensures `next_leaf` traversal still works flawlessly after root split.

### 4. `btree-find-deep-tree`
- **Input**: Insert 1000 records → `btree find 850`
- **Expected**: `FOUND` and returns correct record. Validates internal node routing logic cascades through multiple levels.

## Implementation Checklist

1. Define `INTERNAL_NODE_MAX_KEYS`.
2. Implement `internal_node_split()`.
3. Handle median key extraction and promotion upward.
4. Support root internal node split (creating 2 new children).
5. Support recursive splitting for non-root internal nodes.
