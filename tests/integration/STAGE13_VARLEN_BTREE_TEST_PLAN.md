# Stage 13: B-Tree with Variable-Length Cells

## Concept
Adapt the B-tree to store variable-length cells using the slotted page format. The key change: leaf page capacity depends on the actual data size, not a fixed cell count.

## What It Teaches
- **Variable capacity**: With fixed 512-byte cells, a leaf always held ~7 rows. With variable-length cells, a leaf storing short rows (name="a") might hold 50+ rows, while long rows (name=200 chars) might fit only 5. The B-tree adapts automatically.
- **Byte-based split trigger**: Instead of `num_cells > MAX_CELLS`, split when `free_space < min_record_size + slot_size`. This teaches the student to think in bytes, not counts.
- **Split strategy**: On split, divide cells so each half gets roughly equal byte usage (not equal cell count). This balances the tree for varied row sizes.
- **Internal nodes remain fixed**: Internal node cells are `[key:4][child_page:4]` = 8 bytes always. Only leaf cells are variable-length.

## Learning Objectives
1. Modify `btree_insert` to use the slotted page format for leaf cells.
2. Implement byte-based split detection (`free_space < threshold`).
3. Implement split logic that divides cells by byte usage.
4. Verify that small rows produce more cells per leaf than Part 1.
5. Verify that large rows trigger splits with fewer cells.
6. Update `btree dump` to show cell byte sizes.
7. Ensure `btree find`, `btree structure`, and `SELECT` all work with the new format.

## Updated Debug Output: `btree dump <page>`

```
[BTREE] Page 0: type=LEAF num_cells=12 free_space=1200
[BTREE]   Cell 0: key=1 (22 bytes)
[BTREE]   Cell 1: key=2 (18 bytes)
[BTREE]   Cell 2: key=3 (45 bytes)
```

## How to Run
```bash
make test-c-stage13
```
