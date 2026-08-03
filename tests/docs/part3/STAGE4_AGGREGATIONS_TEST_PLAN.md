# Stage 4: Aggregations (COUNT, SUM, AVG, MIN, MAX)

## Concept
Implement aggregate functions that compute summary values over sets of rows, producing a single summary row for the entire table.

## What It Teaches
- **Aggregate PlanNode**: A node that consumes all rows from its child, computes aggregate values, and emits a single summary row.
- **Accumulators**: Each aggregate function (COUNT, SUM, AVG, MIN, MAX) maintains an accumulator that is updated for each input row.

## Learning Objectives
1. Implement `COUNT(*)`, `COUNT(column)`, `SUM(column)`, `AVG(column)`, `MIN(column)`, `MAX(column)`.
2. Implement an `AggregateNode` PlanNode that consumes all child rows and produces summary output.
3. Handle `NULL` values correctly in aggregates (COUNT skips NULLs, SUM treats NULL as 0).

## New SQL Syntax
```sql
SELECT COUNT(*) FROM users;
SELECT AVG(id) FROM users;
SELECT MIN(id), MAX(id) FROM users;
```

## Explain Output
```
[PLAN] SELECT COUNT(*) FROM users
[PLAN]   └── Aggregate (aggs=[COUNT(*)])
[PLAN]       └── SeqScan (table=users)
```
