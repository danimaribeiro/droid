# Stage 16: Transactions — BEGIN / COMMIT

## Concept
Introduce transaction control so multiple statements can be grouped into an atomic unit. Either all changes within a transaction are committed (permanent), or none are.

## What It Teaches
- **Atomicity**: The "A" in ACID. A group of INSERTs either all succeed or all fail. Without transactions, a crash after the 3rd of 5 INSERTs leaves the database in an inconsistent state.
- **Auto-commit vs explicit transactions**: Without BEGIN, each statement is its own transaction (auto-commit mode). With BEGIN, the student explicitly controls when changes become permanent.
- **Transaction state machine**: The database has three states — `IDLE` (no active tx), `IN_TRANSACTION` (after BEGIN), `ERROR` (something failed). Certain commands are only valid in certain states.
- **Commit = flush**: The simplest implementation of COMMIT is to flush all dirty pages to disk. Before COMMIT, changes exist only in memory and are lost on exit.

## Transaction Lifecycle

```
IDLE ──BEGIN──→ IN_TRANSACTION ──COMMIT──→ IDLE
                     │                       ↑
                     └───────ROLLBACK────────┘
```

## Learning Objectives
1. Implement `BEGIN;` that transitions to `IN_TRANSACTION` state.
2. Implement `COMMIT;` that flushes all dirty pages and transitions to `IDLE`.
3. In auto-commit mode (no BEGIN), each statement implicitly commits.
4. If `.exit` is called without COMMIT, uncommitted changes are discarded.
5. Produce errors for invalid state transitions (nested BEGIN, COMMIT without BEGIN).
6. Verify that SELECT within a transaction sees uncommitted data (read-your-writes).

## How to Run
```bash
make test-c-stage16
```
