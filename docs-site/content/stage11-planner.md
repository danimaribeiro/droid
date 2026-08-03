---
stage: 11
title: "Query Planner & Executor (Volcano Model)"
subtitle: "Separating what to do from how to do it with pull-based row iteration"
section: "Persistence & Query Execution"
objective: "Transform parsed AST nodes into executable plan trees using the Volcano iterator model, choosing IndexScan for primary key lookups and SeqScan for non-key filters or full table scans."
concepts:
  - "The Volcano (Iterator) Model as the universal query execution paradigm used by PostgreSQL, SQLite, and MySQL"
  - "Pull-based row iteration where the executor calls Next() on the root plan node in a loop"
  - "Plan node composition: SeqScan, IndexScan, and Insert as interchangeable execution strategies"
  - "Planner decision logic: choosing the optimal scan strategy based on WHERE clause analysis"
algorithms:
  - title: "Volcano Iterator Protocol"
    description: "Every query is executed by building a tree of plan nodes, each implementing three operations: Init(), Next(), and Close(). The executor pulls rows from the root node until exhaustion."
    steps:
      - "Define a PlanNode struct containing function pointers for init(), next(), and close() operations, plus node-specific state (cursor position, filter predicate, target key)."
      - "The executor calls init() on the root plan node to prepare cursors and resources."
      - "In a tight loop, call next() on the root node. Each call returns either a pointer to the next matching row, or NULL to signal exhaustion."
      - "When next() returns NULL, call close() to release cursors, memory, and file handles."
  - title: "SeqScan Node Implementation"
    description: "The SeqScan node iterates through all leaf pages using the cursor infrastructure from Stage 7, optionally applying a row filter."
    steps:
      - "In init(), call table_start() to position a cursor at the first cell of the leftmost leaf page."
      - "In next(), deserialize the row at the current cursor position. If a WHERE filter is present, evaluate it against the deserialized row fields."
      - "If the row passes the filter (or no filter exists), return the row pointer. If not, call cursor_advance() and retry."
      - "When cursor.is_eof becomes true, return NULL to signal scan completion."
  - title: "IndexScan Node Implementation"
    description: "The IndexScan node leverages btree_find() for O(log n) primary key lookup, returning at most one row."
    steps:
      - "In init(), call btree_find(table, key, &cursor) with the WHERE clause integer value."
      - "If btree_find() returns true (key found), store the cursor position and mark the node as having one result pending."
      - "In the first next() call, deserialize and return the found row. In all subsequent calls, return NULL (at most 1 row from a primary key lookup)."
      - "If btree_find() returned false in init(), every next() call immediately returns NULL."
  - title: "Planner Decision Logic"
    description: "The planner inspects the parsed AST to determine which plan node to construct."
    steps:
      - "If the statement type is INSERT, construct an Insert plan node."
      - "If the statement type is SELECT and the WHERE clause filters on column 'id' (the primary key), construct an IndexScan node with the target key value."
      - "If the statement type is SELECT and the WHERE clause filters on a non-key column (e.g., 'name'), construct a SeqScan node with the filter attached."
      - "If the statement type is SELECT with no WHERE clause, construct a bare SeqScan node (full table scan)."
checklist:
  - "Define PlanNode struct with init/next/close function pointers and union for node-specific state"
  - "Implement SeqScanNode: full table cursor traversal with optional row filter evaluation"
  - "Implement IndexScanNode: O(log n) btree_find() lookup returning at most 1 row"
  - "Implement InsertNode: serialize row and call btree_insert()"
  - "Implement plan_query(ast, table) function with the scan strategy decision logic"
  - "Refactor execute_statement() to build a plan and loop next() until NULL"
  - "Implement the 'explain <sql>' debug command to display the chosen plan without executing"
  - "Verify IndexScan is chosen for WHERE id = N queries (confirm via explain output)"
  - "Verify SeqScan is chosen for WHERE name = 'value' queries and full table scans"
---

## The Monolith Problem

Before this stage, our `execute_select()` function was a monolithic block of code that mixed three distinct responsibilities into a single tangled function:

1. **Deciding** how to scan the table (full scan vs. key lookup)
2. **Executing** the actual row retrieval and cursor navigation
3. **Formatting** the output rows for display

This architecture works for simple cases, but it becomes unmaintainable as query complexity grows. What happens when we need to add ORDER BY? LIMIT? JOINs across multiple tables? Each new feature would require modifying the same monolithic function, creating an ever-growing tangle of nested conditionals.

Production databases solve this problem with a clean architectural separation that has remained virtually unchanged since the 1970s:

```mermaid
flowchart TD
    SQL["📝 SQL Input"]
    Parser["🔤 Parser"]
    AST["AST (Abstract Syntax Tree)"]
    Planner["🧠 Planner"]
    Plan["Execution Plan (tree of plan nodes)"]
    Executor["⚙️ Executor"]
    Rows["Row stream (pull-based iteration)"]

    SQL --> Parser --> AST --> Planner --> Plan --> Executor --> Rows

    style SQL fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fde68a
    style Parser fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#d8b4fe
    style AST fill:#1e1b4b,stroke:#a855f7,stroke-width:1px,color:#d8b4fe
    style Planner fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#a7f3d0
    style Plan fill:#064e3b,stroke:#34d399,stroke-width:1px,color:#a7f3d0
    style Executor fill:#7f1d1d,stroke:#f87171,stroke-width:2px,color:#fca5a5
    style Rows fill:#7f1d1d,stroke:#f87171,stroke-width:1px,color:#fca5a5
```

## The Volcano Model: Pull-Based Iteration

The **Volcano Model** (also called the Iterator Model) was formalized by Goetz Graefe in 1994 and remains the dominant execution paradigm in every major relational database today. The core principle is deceptively simple:

Every plan node implements exactly three operations:

```
Init()  → Prepare the node (open cursors, allocate resources)
Next()  → Return the next qualifying row, or NULL when exhausted
Close() → Release all resources (close cursors, free memory)
```

The executor drives execution by calling `Next()` on the **root** plan node in a tight loop. Each node may internally call `Next()` on its child nodes — this creates a **pull-based** data flow where rows are produced on demand, one at a time, from the leaves of the plan tree upward.

```mermaid
flowchart TD
    Init["plan->init()"]
    Loop{"row = plan->next()"}
    Print["print_row(row)\ncount++"]
    Close["plan->close()\nprintf - count rows"]

    Init --> Loop
    Loop -->|row != NULL| Print --> Loop
    Loop -->|NULL| Close

    style Init fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#a7f3d0
    style Loop fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#d8b4fe
    style Print fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fde68a
    style Close fill:#7f1d1d,stroke:#f87171,stroke-width:2px,color:#fca5a5
```

## Plan Node Types

### SeqScan: The Full Table Scanner

The SeqScan node traverses every leaf cell in the B+Tree using the cursor infrastructure from Stage 7. It follows the `next_leaf` sibling pointers to hop across leaf page boundaries.

When a WHERE filter is present on a non-key column (like `name`), the SeqScan deserializes each row and evaluates the filter predicate. Rows that fail the filter are silently skipped — the executor never sees them.

```mermaid
flowchart LR
    subgraph Leaf1["🍃 Leaf Page 1"]
        C1["id=1 alice ❌"]
        C2["id=2 bob ✅"]
        C3["id=3 charlie ❌"]
    end
    subgraph Leaf2["🍃 Leaf Page 2"]
        C4["id=4 bob ✅"]
        C5["id=5 eve ❌"]
        C6["id=6 frank ❌"]
    end
    subgraph Leaf3["🍃 Leaf Page 3"]
        C7["id=7 grace ❌"]
        C8["id=8 heidi ❌"]
        C9["id=9 ivan ❌"]
    end
    Result["Result: 2 rows\n(id=2 and id=4)"]

    Leaf1 --> Leaf2 --> Leaf3 --> Result

    style Leaf1 fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#a7f3d0
    style Leaf2 fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#a7f3d0
    style Leaf3 fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#a7f3d0
    style Result fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#d8b4fe
```

### IndexScan: The Logarithmic Precision Lookup

When the WHERE clause filters on the primary key (`id`), the planner recognizes that the B+Tree is indexed on this exact column. Instead of scanning every leaf cell, it calls `btree_find(key)` to descend through internal routing nodes directly to the target cell in O(log n) time.

An IndexScan returns **at most one row** (since primary keys are unique), making it extraordinarily efficient for point queries.

```mermaid
flowchart TD
    Root["🗂️ INTERNAL (root)\nkeys=[4, 8]"]
    L1["🍃 Leaf Page 1\nkeys < 4"]
    L2["🍃 Leaf Page 2\n[id=5 | eve] ← FOUND!"]
    L3["🍃 Leaf Page 3\nkeys > 8"]

    Root -->|"key < 4"| L1
    Root -->|"4 ≤ key ≤ 8"| L2
    Root -->|"key > 8"| L3

    style Root fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#d8b4fe
    style L1 fill:#064e3b,stroke:#34d399,stroke-width:1px,color:#a7f3d0
    style L2 fill:#064e3b,stroke:#34d399,stroke-width:3px,color:#a7f3d0
    style L3 fill:#064e3b,stroke:#34d399,stroke-width:1px,color:#a7f3d0
```

## The Planner Decision Engine

The planner inspects the parsed AST and makes a single, critical decision: which scan strategy to use.

```mermaid
flowchart TD
    AST["Parsed AST"]
    IsInsert{"INSERT?"}
    IsSelect{"SELECT?"}
    HasWhere{"WHERE on 'id'?"}
    InsertNode["🟠 InsertNode"]
    IndexScan["🟢 IndexScan(key=value)"]
    SeqScan["🔵 SeqScan(filter=WHERE or NULL)"]

    AST --> IsInsert
    IsInsert -->|Yes| InsertNode
    IsInsert -->|No| IsSelect
    IsSelect -->|Yes| HasWhere
    HasWhere -->|Yes| IndexScan
    HasWhere -->|No| SeqScan

    style AST fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fde68a
    style InsertNode fill:#7f1d1d,stroke:#f87171,stroke-width:2px,color:#fca5a5
    style IndexScan fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#a7f3d0
    style SeqScan fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#d8b4fe
```

This decision logic is intentionally simple in Stage 10, but it establishes the architectural foundation for the **cost-based query optimizer** in Stage 25, where the planner will analyze table statistics, index availability, and estimated row counts to choose the cheapest execution strategy.

## The explain Command

The `explain` debug command reveals the planner's decision without executing the query:

```
> explain select * from users;
[PLAN] SELECT * FROM users
[PLAN]   └── SeqScan (table=users)

> explain select * from users where id = 2;
[PLAN] SELECT * FROM users WHERE id = 2
[PLAN]   └── IndexScan (table=users, key=2)

> explain select * from users where name = 'alice';
[PLAN] SELECT * FROM users WHERE name = 'alice'
[PLAN]   └── SeqScan (table=users, filter: name = 'alice')
```

This is the same concept as PostgreSQL's `EXPLAIN` and SQLite's `EXPLAIN QUERY PLAN` — an indispensable debugging tool that reveals whether the engine is using indexes efficiently or falling back to expensive full table scans.

## Why This Architecture Matters

After completing Stage 10, you will have separated:

* **What to do** (the Planner) from **how to do it** (the Executor)
* **Scan strategy** (IndexScan vs. SeqScan) from **row processing** (filter + output)

This separation is not academic — it is the exact same architecture powering PostgreSQL, MySQL, SQLite, CockroachDB, and virtually every relational database engine in production today. Future stages will add new plan node types (JoinNode, SortNode, AggregateNode) that plug seamlessly into this Volcano framework without touching the executor loop.
