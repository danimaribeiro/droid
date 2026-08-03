# Stage 17: Transactions — ROLLBACK & Undo Log

## Concept
Implement ROLLBACK to undo all changes made within the current transaction, restoring the database to its state at the point of BEGIN.

## What It Teaches
- **Undo log**: To support ROLLBACK, the database must record "before images" — what the data looked like before the transaction modified it. On ROLLBACK, these before images are restored.
- **Page-level undo**: The simplest approach copies the entire page before modifying it. On ROLLBACK, the original pages are restored. This is expensive in memory but simple to implement and teaches the concept clearly.
- **Undo vs Redo**: An undo log records "what was there before" (for ROLLBACK). A redo log records "what should be there after" (for crash recovery). Stage 18 (WAL) adds the redo side.
- **Transaction isolation**: After ROLLBACK, the database looks exactly as it did before BEGIN. No trace of the rolled-back changes exists.

## Undo Log Design

```
On page modification:
  1. If this page hasn't been saved yet for this tx:
     → Copy original page to undo buffer
  2. Apply the modification

On COMMIT:
  → Discard the undo buffer (changes are final)

On ROLLBACK:
  → Restore all pages from the undo buffer
  → Transition to IDLE state
```

## Learning Objectives
1. Implement an in-memory undo buffer that stores original page copies.
2. Before modifying a page, save a copy if it hasn't been saved for this transaction.
3. Implement `ROLLBACK;` that restores pages from the undo buffer.
4. Ensure previously committed data is not affected by ROLLBACK.
5. Verify that ROLLBACK → new BEGIN → COMMIT works correctly.
6. Produce error for ROLLBACK without an active transaction.

## How to Run
```bash
make test-c-stage17
```
