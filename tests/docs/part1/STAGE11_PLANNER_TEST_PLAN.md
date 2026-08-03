# Stage 10: Query Planner & Executor (Volcano Model) Test Plan

This document outlines the testing strategy for the Query Planner and Executor stage (Stage 10) in all language implementations.

## Stage 10 Objectives
1. Transform a parsed AST into an **Execution Plan** composed of plan nodes.
2. Implement the **Volcano (Iterator) Model** where each plan node has `Init()`, `Next()`, `Close()` methods.
3. The planner chooses the right scan strategy based on the WHERE clause:
   - **IndexScan**: when the WHERE clause filters on the primary key (`id`), use the B-tree for O(log n) lookup.
   - **SeqScan**: when the WHERE clause filters on a non-key column (e.g., `name`) or there is no WHERE clause, scan all rows sequentially.
4. Implement the `explain` debug command to inspect the chosen plan.

## Conceptual Model

### The Volcano / Iterator Pattern

Every query is executed by building a tree of **plan nodes**. Each node implements three operations:

```
Init()  → prepare the node for scanning (open cursors, etc.)
Next()  → return the next row, or NULL when exhausted
Close() → release resources
```

The **executor** calls `Next()` on the root node in a loop until it returns NULL. Each node may call `Next()` on its child nodes — this is the "pull-based" pattern.

### Plan Node Types

| Node | When Used | Behavior |
|------|-----------|----------|
| `SeqScan` | No WHERE, or WHERE on non-key column | Iterates all leaf pages, deserializes each row, applies optional filter |
| `IndexScan` | WHERE on primary key (`id = N`) | Uses `btree_find(key)` for O(log n) lookup, returns at most 1 row |
| `Insert` | INSERT statement | Serializes row, calls `btree_insert`, returns 0 rows |

### Planner Decision Logic

```
IF statement is INSERT:
    return Insert node
IF statement is SELECT:
    IF has WHERE clause AND WHERE column is 'id':
        return IndexScan(key = WHERE value)
    ELSE:
        return SeqScan(filter = WHERE clause or NULL)
```

## Debug Command: `explain <sql>`

Shows the execution plan without running it.

### Output Format Contract

```
[PLAN] SELECT * FROM users
[PLAN]   └── SeqScan (table=users)
```

```
[PLAN] SELECT * FROM users WHERE id = 2
[PLAN]   └── IndexScan (table=users, key=2)
```

```
[PLAN] SELECT * FROM users WHERE name = 'alice'
[PLAN]   └── SeqScan (table=users, filter: name = 'alice')
```

```
[PLAN] INSERT INTO users VALUES (...)
[PLAN]   └── Insert (table=users)
```

## Test Cases

All tests are in `tests/integration/python/stage10/planner_tests.py` and run via `make test-stage10`.

### Plan Choice Tests (explain only)

#### 1. `explain-select-seqscan`
- **Input**: `explain select * from users;`
- **Expected**: `[PLAN]`, `SeqScan`, `table=users`. Must NOT contain `IndexScan`.

#### 2. `explain-select-indexscan`
- **Input**: `explain select * from users where id = 2;`
- **Expected**: `[PLAN]`, `IndexScan`, `key=2`. Must NOT contain `SeqScan`.

#### 3. `explain-select-seqscan-filter`
- **Input**: `explain select * from users where name = 'alice';`
- **Expected**: `[PLAN]`, `SeqScan`, `filter:`. Must NOT contain `IndexScan`.

#### 4. `explain-insert`
- **Input**: `explain insert into users (id, name, email) values (1, 'test', 'test@t.com');`
- **Expected**: `[PLAN]`, `Insert`, `table=users`.

### End-to-End Tests (explain + execute)

#### 5. `indexscan-end-to-end`
- **Input**: INSERT 3 rows → `explain select * from users where id = 2;` → `select * from users where id = 2;`
- **Expected**: `IndexScan` in explain output. Only `bob` in SELECT result. `(1 rows)`. Must NOT contain `alice` or `charlie`.

#### 6. `seqscan-filter-end-to-end`
- **Input**: INSERT 3 rows → `explain select * from users where name = 'bob';` → `select * from users where name = 'bob';`
- **Expected**: `SeqScan` and `filter:` in explain. Only `bob` in result. Must NOT contain `IndexScan`.

#### 7. `seqscan-full-scan-end-to-end`
- **Input**: INSERT 2 rows → `explain select * from users;` → `select * from users;`
- **Expected**: `SeqScan` in explain. Both rows in result. `(2 rows)`. Must NOT contain `IndexScan`.

### Error Tests

#### 8. `explain-syntax-error`
- **Input**: `explain select from;`
- **Expected**: `[ERROR:` present (parser error propagated through explain).

## Implementation Checklist

The student refactors their existing `execute_select` and `execute_insert` to use the Volcano pattern:

1. Define `PlanNode` struct with function pointers: `init`, `next`, `close`.
2. Implement `SeqScanNode`: cursor through all leaf pages, optionally filter rows.
3. Implement `IndexScanNode`: use `btree_find(key)`, return at most 1 row.
4. Implement `InsertNode`: serialize row, btree_insert.
5. Implement `plan_query(AST_Node *ast, Table *table)`: returns the appropriate `PlanNode`.
6. Refactor `execute_statement` to build a plan, then loop `next()` until NULL.
7. Add `explain` command handler in `engine.c`.

## Why This Matters

Before Stage 10, `execute_select` was a monolithic function that mixed plan selection, scanning, and output formatting. After Stage 10, the student has separated:

- **What to do** (planner) from **how to do it** (executor)
- **Scan strategy** (IndexScan vs SeqScan) from **row processing** (filter + output)

This is the same architecture used by PostgreSQL, SQLite, and every production database.

## How to Run

```bash
make test-stage10         # all binaries
make test-c-stage10       # C only
make test-all-stages      # all stages
```
