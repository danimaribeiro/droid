# Stage 19: DELETE & UPDATE

## Concept
Implement data modification operations that change or remove existing rows in the B-tree.

## What It Teaches
- **Tombstones**: Marking a row as deleted without immediately removing it from the page. The B-tree cell remains but is flagged as dead.
- **In-place UPDATE**: Overwriting a row's payload when the new data fits in the same slot. When it doesn't fit, DELETE + INSERT.
- **Page compaction**: Reclaiming space from tombstoned cells within a page by shifting live records and rebuilding the slot directory.
- **Cursor-based modification**: Using the existing B-tree cursor (from SELECT) to position on the target row, then modifying it.

## Learning Objectives
1. Implement `execute_delete` that locates a row by key and marks it as a tombstone.
2. Implement `execute_update` that modifies field values in an existing row.
3. Handle the case where an UPDATE changes a variable-length field and the new row no longer fits in the original slot.
4. Implement page compaction to reclaim dead space.
5. Ensure SELECT skips tombstoned rows.
6. Ensure row count in `(N rows)` excludes deleted rows.

## New SQL Commands
```sql
DELETE FROM users WHERE id = 1;
UPDATE users SET name = 'new_name' WHERE id = 1;
```

## Debug Command
`btree dump` should show tombstoned cells with a `[DELETED]` marker.
