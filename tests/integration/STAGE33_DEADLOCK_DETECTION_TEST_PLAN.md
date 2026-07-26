# Stage 33: Deadlock Detection

## Concept
Detect and resolve circular lock dependencies where two or more transactions are waiting for each other indefinitely.

## What It Teaches
- **Deadlock scenario**: Transaction A holds lock on page 1, waits for page 2. Transaction B holds lock on page 2, waits for page 1. Neither can proceed — this is a deadlock.
- **Wait-for graph**: A directed graph where nodes are transactions and edges represent "waits for" relationships. A cycle in this graph means deadlock.
- **Cycle detection**: Use depth-first search on the wait-for graph. If DFS finds a back edge (visiting an already-visited node), there's a cycle = deadlock.
- **Victim selection**: When a deadlock is detected, one transaction must be aborted (the "victim"). Common strategies: abort the youngest transaction, abort the one with least work done, or abort randomly.
- **Deadlock prevention vs detection**: Prevention avoids deadlocks by ordering lock acquisition. Detection allows deadlocks to occur and resolves them after the fact. The student implements detection (simpler to understand).

## Wait-for Graph

```
Deadlock:
  TX1 ──waits_for──→ TX2 ──waits_for──→ TX1    (cycle!)

No deadlock:
  TX1 ──waits_for──→ TX2 ──waits_for──→ TX3    (no cycle)
```

## Learning Objectives
1. Build a wait-for graph from the lock manager's wait queues.
2. Implement cycle detection using DFS.
3. When a deadlock is detected, choose a victim transaction and abort it (ROLLBACK).
4. Produce a clear error message: `[ERROR] Deadlock detected: transaction X was aborted`.
5. The aborted transaction's locks are released, allowing the other transaction to proceed.
6. (Stretch) Implement deadlock timeout as an alternative — if a lock wait exceeds N seconds, abort.

## Debug Command: `lock wait-graph`
```
[LOCKS] Wait-for graph:
[LOCKS]   TX1 → TX2
[LOCKS]   TX2 → TX1
[LOCKS] DEADLOCK detected: aborting TX2
```
