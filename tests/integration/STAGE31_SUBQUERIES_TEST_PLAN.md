# Stage 30: Subqueries

## Concept
Implement nested SELECT statements that appear inside WHERE clauses, allowing one query's result to feed into another query's filter.

## What It Teaches
- **Nested execution**: The executor creates a child executor for the subquery, runs it to completion, then uses its results in the outer query. This is recursive — a subquery can itself contain subqueries.
- **Correlated vs uncorrelated subqueries**: An uncorrelated subquery runs once (e.g., `WHERE id IN (SELECT user_id FROM orders)`). A correlated subquery runs once per outer row (e.g., `WHERE EXISTS (SELECT 1 FROM orders WHERE orders.user_id = users.id)`). Correlated subqueries are dramatically slower.
- **IN operator**: `WHERE id IN (subquery)` materializes the subquery results into a set, then checks membership for each outer row.
- **EXISTS operator**: `WHERE EXISTS (subquery)` returns true if the subquery produces at least one row. It can short-circuit — stop as soon as the first row is found.
- **Scalar subqueries**: `SELECT (SELECT COUNT(*) FROM orders) AS total` — a subquery that returns exactly one value.

## Learning Objectives
1. Extend the parser to recognize subqueries in WHERE clauses.
2. Implement `IN (SELECT ...)` by materializing the subquery into an in-memory set.
3. Implement `EXISTS (SELECT ...)` with early termination.
4. Handle correlated subqueries by re-executing the subquery for each outer row.
5. (Stretch) Support scalar subqueries in the SELECT column list.

## New SQL Syntax
```sql
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);
SELECT * FROM users WHERE EXISTS (SELECT 1 FROM orders WHERE orders.user_id = users.id);
```
