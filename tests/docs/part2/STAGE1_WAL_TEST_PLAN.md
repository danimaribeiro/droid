# Stage 18: WAL & Crash Recovery

## Concept
Implement Write-Ahead Logging to guarantee that committed data survives process crashes, even if the crash occurs during the flush of dirty pages to disk.

## What It Teaches
- **The WAL protocol**: Write changes to a sequential log file BEFORE modifying data pages. If the process crashes, the log is replayed on restart to recover committed changes.
- **Durability guarantee**: The "D" in ACID. After COMMIT returns successfully, the data is guaranteed to be on disk — even if the power goes out one millisecond later.
- **Sequential vs random I/O**: The WAL is a sequential append-only file, which is much faster than random page writes. This is why WAL improves write performance: one fast sequential write replaces many slow random writes.
- **Checkpointing**: Periodically, all dirty pages are flushed to their actual locations and the WAL is truncated. This prevents the WAL from growing indefinitely.
- **Crash recovery**: On startup, the database checks if the WAL has un-checkpointed entries. If so, it replays them to recover committed data.

## WAL Protocol

```
1. BEGIN
2. Make changes in memory (dirty pages)
3. COMMIT:
   a. Write dirty page data to WAL file
   b. Write COMMIT record to WAL
   c. fsync(WAL)  ← data is now durable
   d. Apply changes to actual data pages
   e. CHECKPOINT: truncate WAL when all pages flushed
```

## Learning Objectives
1. Implement WAL file format: header + page records + commit records.
2. On COMMIT, write all dirty pages to WAL before flushing to data file.
3. On startup, detect and replay un-checkpointed WAL entries.
4. Implement the `wal status` debug command.
5. Verify that committed data survives a simulated crash (SIGKILL).
6. Verify that uncommitted data is lost after a crash.

## Debug Command: `wal status`

```
[WAL] File: droid.wal (12288 bytes)
[WAL] Records: 3
[WAL]   Record 0: tx=1 type=PAGE page=0 (4096 bytes)
[WAL]   Record 1: tx=1 type=PAGE page=1 (4096 bytes)
[WAL]   Record 2: tx=1 type=COMMIT
```

## How to Run
```bash
make test-c-stage18
```
