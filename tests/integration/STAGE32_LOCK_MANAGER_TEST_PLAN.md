# Stage 31: Lock Manager

## Concept
Implement a lock manager that controls concurrent access to database resources (rows and pages), preventing data corruption when multiple transactions access the same data.

## What It Teaches
- **Shared vs Exclusive locks**: A shared lock (S) allows concurrent reads. An exclusive lock (X) blocks all other access. Multiple readers can hold S locks simultaneously, but X is exclusive.
- **Lock granularity**: Page-level locks are coarse (lock the entire page, simpler but more contention). Row-level locks are fine (lock individual rows, less contention but more overhead). The student starts with page-level locks.
- **Wait queue**: When a transaction requests a lock held by another transaction, it enters a wait queue and blocks until the lock is released.
- **Lock table**: A hash table mapping resource IDs (page numbers or row keys) to lock entries. Each lock entry tracks the lock mode and the list of holders/waiters.
- **Two-Phase Locking (2PL)**: A transaction acquires locks as needed (growing phase) and releases them all at COMMIT/ROLLBACK (shrinking phase). This guarantees serializability.

## Learning Objectives
1. Implement a lock table data structure mapping resource IDs to lock entries.
2. Implement `lock_acquire(tx_id, resource_id, mode)` with shared/exclusive semantics.
3. Implement `lock_release(tx_id, resource_id)` that wakes up waiting transactions.
4. On COMMIT/ROLLBACK, release all locks held by the transaction.
5. Implement page-level locking for B-tree operations.
6. (Stretch) Implement row-level locking.

## Debug Command: `lock status`
```
[LOCKS] Active locks: 3
[LOCKS]   Page 0: EXCLUSIVE held by tx=1
[LOCKS]   Page 1: SHARED held by tx=2, tx=3
[LOCKS]   Page 2: EXCLUSIVE held by tx=1, waiters=[tx=4]
```
