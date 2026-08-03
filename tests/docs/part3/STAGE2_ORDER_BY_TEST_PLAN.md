# Stage 21: ORDER BY & Sorting

## Concept
Implement the ORDER BY clause to return rows in a specified sort order, including an external sort algorithm for datasets that don't fit in memory.

## What It Teaches
- **Sort PlanNode**: A new Volcano iterator node that sits between the scan and the output. It calls `Next()` on its child until exhausted, sorts the collected rows, then emits them in order.
- **In-memory sort**: When the result set fits in memory, use a standard sorting algorithm (quicksort/mergesort).
- **External sort**: When the result set exceeds available memory, use a **merge sort with temporary files** — sort chunks that fit in memory, write sorted runs to temp files, then merge the runs.
- **Sort direction**: `ASC` (default) and `DESC`.
- **Multi-key sort**: `ORDER BY name ASC, id DESC`.

## Learning Objectives
1. Implement a `SortNode` PlanNode that buffers all rows from its child, sorts them, and emits in order.
2. Support `ASC` and `DESC` sort directions.
3. Support sorting by multiple columns with mixed directions.
4. Implement comparison functions for INT and VARCHAR types.
5. (Stretch) Implement external merge sort for large datasets using temporary page files.

## New SQL Syntax
```sql
SELECT * FROM users ORDER BY name;
SELECT * FROM users ORDER BY name ASC, id DESC;
SELECT * FROM users WHERE id > 5 ORDER BY email DESC;
```

## Explain Output
```
[PLAN] SELECT * FROM users ORDER BY name
[PLAN]   └── Sort (key=name ASC)
[PLAN]       └── SeqScan (table=users)
```
