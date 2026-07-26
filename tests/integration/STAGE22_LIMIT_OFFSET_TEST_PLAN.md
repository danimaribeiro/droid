# Stage 22: LIMIT / OFFSET

## Concept
Implement result set pagination so queries can return a subset of matching rows.

## What It Teaches
- **Early termination**: The `LimitNode` calls `Next()` on its child at most N times, then returns NULL. The executor stops pulling rows — this is the beauty of the Volcano model.
- **OFFSET skip**: The `LimitNode` discards the first M rows by calling `Next()` without emitting them.
- **Interaction with ORDER BY**: `LIMIT` without `ORDER BY` returns an arbitrary subset. `ORDER BY ... LIMIT N` returns the top-N rows.
- **Efficiency insight**: Without a covering index, `LIMIT 10 OFFSET 1000` still scans 1010 rows internally. This teaches why cursor-based pagination is preferred in production.

## Learning Objectives
1. Implement a `LimitNode` PlanNode that wraps another node and caps the number of emitted rows.
2. Support `OFFSET M` to skip M rows before emitting.
3. Ensure `LIMIT 0` returns zero rows (column headers only).
4. Combine with `ORDER BY` for deterministic top-N queries.
5. Update the planner to insert `LimitNode` when LIMIT/OFFSET is present.

## New SQL Syntax
```sql
SELECT * FROM users LIMIT 5;
SELECT * FROM users LIMIT 5 OFFSET 10;
SELECT * FROM users ORDER BY id DESC LIMIT 3;
```

## Explain Output
```
[PLAN] SELECT * FROM users ORDER BY id LIMIT 5
[PLAN]   └── Limit (count=5, offset=0)
[PLAN]       └── Sort (key=id ASC)
[PLAN]           └── SeqScan (table=users)
```
