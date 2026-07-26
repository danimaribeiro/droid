# Stage 32: MVCC (Multi-Version Concurrency Control)

## Concept
Implement Multi-Version Concurrency Control so readers never block writers and writers never block readers. Each row version is tagged with the transaction that created it and (optionally) the transaction that deleted it.

## What It Teaches
- **Row versioning**: Each row stores two hidden fields: `xmin` (the transaction ID that created it) and `xmax` (the transaction ID that deleted/updated it, or 0 if still live). This is how PostgreSQL implements MVCC.
- **Snapshot isolation**: At BEGIN, a transaction takes a "snapshot" — the set of committed transaction IDs at that moment. During SELECT, the transaction sees only rows where `xmin` is in the snapshot and `xmax` is NOT in the snapshot.
- **Readers don't block writers**: A reading transaction sees a consistent snapshot of old data while a writing transaction modifies the current data. Both proceed without waiting.
- **Write conflicts**: If two transactions try to UPDATE the same row, the second one detects a conflict (the row's `xmax` was set by a concurrent transaction) and must abort or retry.
- **Garbage collection**: Old row versions that are no longer visible to any active transaction can be cleaned up by VACUUM.

## Row Version Model

```
Physical Row: [xmin:4][xmax:4][id:4][name_len:2][name:N][email_len:2][email:M]

Visibility Rule:
  visible(row, snapshot) =
    row.xmin is committed AND row.xmin <= snapshot.max_tx
    AND (row.xmax == 0 OR row.xmax is NOT committed OR row.xmax > snapshot.max_tx)
```

## Learning Objectives
1. Add `xmin` and `xmax` fields to the row format.
2. On INSERT, set `xmin = current_tx_id`, `xmax = 0`.
3. On DELETE, set `xmax = current_tx_id` (don't remove the row).
4. On UPDATE, create a new version with `xmin = current_tx_id`, mark old version with `xmax = current_tx_id`.
5. Implement snapshot creation at BEGIN time.
6. Implement visibility check: `is_visible(row, snapshot)`.
7. Modify SeqScan and IndexScan to skip invisible rows.
