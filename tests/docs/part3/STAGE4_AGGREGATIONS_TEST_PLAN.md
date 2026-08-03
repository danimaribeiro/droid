# Stage 23: Aggregations (COUNT, SUM, AVG, GROUP BY)

## Concept
Implement aggregate functions that compute summary values over sets of rows, optionally grouped by one or more columns.

## What It Teaches
- **Aggregate PlanNode**: A node that consumes all rows from its child, computes aggregate values, and emits summary rows. This is fundamentally different from filter/sort nodes because it changes the number and shape of output rows.
- **Accumulators**: Each aggregate function (COUNT, SUM, AVG, MIN, MAX) maintains an accumulator that is updated for each input row.
- **GROUP BY**: Partitions rows into groups by key columns. Each group has its own set of accumulators. Implementation uses a hash table keyed by the group columns.
- **HAVING**: A post-aggregation filter applied to group results (e.g., `HAVING COUNT(*) > 5`).

## Learning Objectives
1. Implement `COUNT(*)`, `COUNT(column)`, `SUM(column)`, `AVG(column)`, `MIN(column)`, `MAX(column)`.
2. Implement an `AggregateNode` PlanNode that consumes all child rows and produces summary output.
3. Implement `GROUP BY` using a hash map of group keys → accumulators.
4. Handle `NULL` values correctly in aggregates (COUNT skips NULLs, SUM treats NULL as 0).
5. (Stretch) Implement `HAVING` clause for filtering groups.

## New SQL Syntax
```sql
SELECT COUNT(*) FROM users;
SELECT name, COUNT(*) FROM orders GROUP BY name;
SELECT name, SUM(price) FROM orders GROUP BY name HAVING SUM(price) > 100;
SELECT AVG(id) FROM users;
SELECT MIN(id), MAX(id) FROM users;
```

## Explain Output
```
[PLAN] SELECT name, COUNT(*) FROM users GROUP BY name
[PLAN]   └── HashAggregate (group_by=name, aggs=[COUNT(*)])
[PLAN]       └── SeqScan (table=users)
```
