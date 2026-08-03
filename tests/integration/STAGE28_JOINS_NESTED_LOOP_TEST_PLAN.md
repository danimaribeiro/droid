# Stage 27: JOINs (Nested Loop)

## Concept
Implement the most fundamental join algorithm — nested loop join — to combine rows from two tables based on a join condition.

## What It Teaches
- **Nested Loop Join**: For each row in the outer (left) table, scan the entire inner (right) table looking for matches. This is O(N×M) but simple to implement and correct.
- **Join as a PlanNode**: The `NestedLoopJoinNode` has two children (left scan, right scan). For each call to `Next()`, it returns the next matching pair. The right child is re-initialized for each row of the left child.
- **Row composition**: The output row of a JOIN is a concatenation of the left row and the right row. The student must handle combined column lists.
- **Join predicates**: `ON users.id = orders.user_id` is evaluated for each (left, right) pair.
- **Cross join**: Without a condition, every left row pairs with every right row (Cartesian product).

## Learning Objectives
1. Extend the parser to recognize `SELECT ... FROM t1 JOIN t2 ON condition`.
2. Implement `NestedLoopJoinNode` with Init/Next/Close that iterates all (left, right) pairs.
3. Evaluate the join predicate for each pair, emitting only matching rows.
4. Handle column name disambiguation (`users.id` vs `orders.id`).
5. Support `CROSS JOIN` (no predicate).
6. Update `explain` to show the join plan.

## New SQL Syntax
```sql
SELECT * FROM users JOIN orders ON users.id = orders.user_id;
SELECT users.name, orders.total FROM users JOIN orders ON users.id = orders.user_id;
SELECT * FROM t1 CROSS JOIN t2;
```

## Explain Output
```
[PLAN] SELECT * FROM users JOIN orders ON users.id = orders.user_id
[PLAN]   └── NestedLoopJoin (on: users.id = orders.user_id)
[PLAN]       ├── SeqScan (table=users)
[PLAN]       └── SeqScan (table=orders)
```
