# Stage 25: Cost-Based Optimizer

## Concept
Replace the rule-based planner (if column is `id` → IndexScan, else → SeqScan) with a cost-based optimizer that estimates the cost of each possible plan and picks the cheapest one.

## What It Teaches
- **Table statistics**: Collecting and storing metadata about each table — row count, distinct values per column, average row size, page count. This is what PostgreSQL's `ANALYZE` command does.
- **Cardinality estimation**: Predicting how many rows a filter will return. For `WHERE id = 5` on a table with 1000 rows and 1000 distinct ids, the estimate is ~1 row. For `WHERE name = 'alice'` with 10 distinct names, the estimate is ~100 rows.
- **Cost model**: Assigning a numerical cost to each plan. SeqScan cost = number_of_pages. IndexScan cost = tree_depth + 1 (for the page lookup). The optimizer picks the plan with the lowest cost.
- **When SeqScan beats IndexScan**: If a filter matches most rows (low selectivity), SeqScan is cheaper because it reads pages sequentially. IndexScan is cheaper only when the filter is highly selective.

## Learning Objectives
1. Implement an `ANALYZE` command that scans a table and computes statistics (row_count, distinct values per column, avg row size).
2. Store statistics in the schema catalog.
3. Implement a cost model: `cost_seqscan = pages`, `cost_indexscan = tree_depth + estimated_rows`.
4. Implement selectivity estimation: `selectivity = 1 / distinct_values`.
5. The planner generates all candidate plans and picks the one with lowest estimated cost.
6. `explain` shows the estimated cost and row count.

## New SQL Syntax
```sql
ANALYZE users;  -- collects statistics
```

## Explain Output
```
[PLAN] SELECT * FROM users WHERE name = 'alice'
[PLAN]   └── SeqScan (table=users, filter: name = 'alice')
[PLAN]       estimated_cost=12.0 estimated_rows=100
```
