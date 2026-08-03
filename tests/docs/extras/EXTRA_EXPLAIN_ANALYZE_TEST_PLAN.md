# Extra Stage: EXPLAIN ANALYZE

## Concept
Extend `explain` to actually execute the query and report real timing and row counts alongside the estimated values from the planner.

## What It Teaches
- **Estimated vs actual**: The planner estimates costs and row counts. `EXPLAIN ANALYZE` shows both the estimates and what actually happened. When these differ significantly, it reveals that table statistics are stale or the cost model is inaccurate.
- **Operator timing**: Each PlanNode measures its own execution time. The student wraps Init/Next/Close with timer calls. This teaches profiling at the operator level.
- **Bottleneck identification**: By seeing which operator consumed the most time, the student learns to identify performance bottlenecks — is it the scan, the sort, the join, or the filter?
- **Execution statistics**: Beyond timing — actual rows processed, pages read, cache hits/misses per operator.

## Learning Objectives
1. Add timing instrumentation to each PlanNode (start/end timestamps around Next()).
2. Implement `EXPLAIN ANALYZE <sql>` that executes the query and collects stats.
3. Display estimated vs actual row counts per operator.
4. Display execution time per operator in milliseconds.
5. Display total execution time.

## Output Format
```
[PLAN] SELECT * FROM users WHERE name = 'alice'
[PLAN]   └── SeqScan (table=users, filter: name = 'alice')
[PLAN]       estimated_rows=100  actual_rows=1
[PLAN]       estimated_cost=12.0
[PLAN]       actual_time=0.42ms  pages_read=12
[PLAN] Total execution time: 0.45ms
```

## Why This Matters
`EXPLAIN ANALYZE` is the #1 tool for database performance debugging. Every DBA uses it daily. Understanding how to build it teaches the student how query performance is measured and optimized.
