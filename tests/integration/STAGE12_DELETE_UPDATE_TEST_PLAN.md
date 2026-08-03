# Stage 12: DELETE & UPDATE (Fixed-Size Rows)

## Concept
Implement data modification operations that change or remove existing rows in the B-tree before we transition to variable-length rows.

## What It Teaches
- **Leaf Node Deletion**: Removing a cell from a leaf node and shifting subsequent cells left to close the gap.
- **In-place UPDATE**: Overwriting a row's payload (name, email) in a fixed-size slot without modifying its B-tree key (id).
- **Execution Nodes**: Implementing `DeleteNode` and `UpdateNode` in the Volcano Executor.

## Why Stage 12?
By implementing these operations now, we complete the basic CRUD operations of the database while rows are still fixed-size (255 chars max). This avoids the complexities of page compaction, tombstones, and slotted arrays required for variable-length strings.

## Learning Objectives
1. Implement `execute_delete` that locates a row by key using `btree_find`, shifts array elements in the leaf page left by one cell, and decrements `num_cells`.
2. Implement `execute_update` that modifies `name` and `email` field values directly in the leaf cell payload.
3. Hook these operations into the Query Planner as new `PlanNode` types.
4. Ensure `(N rows)` in SELECT correctly reflects the count after deletions.

## New SQL Commands
```sql
DELETE FROM users WHERE id = 1;
UPDATE users SET name = 'new_name' WHERE id = 1;
```

## Debug Command
`btree dump` should accurately reflect the reduced `num_cells` after a deletion.

## Implementation Details
- **Delete algorithm**: 
  1. `btree_find(id)` to get cursor.
  2. If not found, return "Row not found".
  3. `memmove` to shift cells from `cursor.cell_num + 1` to `num_cells` left by one cell (`ROW_SIZE + 4`).
  4. Decrement `num_cells`.
  5. (Optional for now) If `num_cells == 0`, merge with sibling (Underflow/Merge). Many simpler DBs skip merging and rely on VACUUM later. We will skip merging here to keep it simple.
- **Update algorithm**:
  1. `btree_find(id)` to get cursor.
  2. If not found, return "Row not found".
  3. Deserialize existing row, apply new field values, reserialize back into the exact same cell memory.
