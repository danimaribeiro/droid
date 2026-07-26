# Stage 28: Hash Join

## Concept
Implement a hash-based join algorithm that is dramatically faster than nested loop join for large tables with equality conditions.

## What It Teaches
- **Build phase**: Scan the smaller (build) table and insert each row into an in-memory hash table, keyed by the join column.
- **Probe phase**: Scan the larger (probe) table. For each row, look up the join column in the hash table. If found, emit the joined row.
- **O(N+M) vs O(N×M)**: Hash join is linear in the total number of rows, compared to nested loop's quadratic cost. The student sees a dramatic performance difference.
- **When hash join is applicable**: Only works for equality joins (`=`), not range joins (`>`).
- **Memory trade-off**: The hash table must fit in memory. If it doesn't, the student learns about partitioned (grace) hash join.
- **Planner integration**: The cost-based optimizer should prefer hash join when both sides are large.

## Learning Objectives
1. Implement `HashJoinNode` PlanNode with build and probe phases.
2. Build a hash table from the smaller input during `Init()`.
3. During `Next()`, probe the hash table for each row of the larger input.
4. Handle hash collisions (multiple rows with the same join key).
5. Update the planner to choose HashJoin vs NestedLoopJoin based on estimated table sizes.
6. Update `explain` to show the chosen join algorithm.

## Explain Output
```
[PLAN] SELECT * FROM users JOIN orders ON users.id = orders.user_id
[PLAN]   └── HashJoin (on: users.id = orders.user_id)
[PLAN]       ├── SeqScan (table=users)     [build]
[PLAN]       └── SeqScan (table=orders)    [probe]
```
