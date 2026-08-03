# Stage 24: Secondary Indexes (CREATE INDEX)

## Concept
Allow creating B-tree indexes on non-primary-key columns so the query planner can use IndexScan for any indexed column, not just `id`.

## What It Teaches
- **Non-clustered indexes**: A secondary index is a separate B-tree where the key is the indexed column value and the payload is a pointer (primary key) back to the main table's B-tree.
- **Index maintenance**: Every INSERT, UPDATE, and DELETE must also update all secondary indexes on that table.
- **Index selection in the planner**: The planner checks which indexes exist and whether the WHERE clause matches an indexed column.
- **Covering indexes (stretch)**: When the index contains all columns needed by the query, the executor can skip the main table lookup entirely.

## Learning Objectives
1. Implement `CREATE INDEX idx_name ON table (column);` that builds a new B-tree.
2. Store index metadata in the schema catalog alongside table definitions.
3. On INSERT, also insert into all relevant secondary indexes.
4. Update the planner to choose IndexScan when WHERE matches a secondary index.
5. Implement the index lookup: find key in secondary B-tree → get primary key → lookup in main B-tree.
6. `explain` shows which index is used.

## New SQL Syntax
```sql
CREATE INDEX idx_users_name ON users (name);
SELECT * FROM users WHERE name = 'alice';  -- now uses IndexScan
```

## Explain Output
```
[PLAN] SELECT * FROM users WHERE name = 'alice'
[PLAN]   └── IndexScan (table=users, index=idx_users_name, key='alice')
```
