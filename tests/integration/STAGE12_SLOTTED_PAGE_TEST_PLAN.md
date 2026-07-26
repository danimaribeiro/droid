# Stage 12: Slotted Page Architecture

## Concept
Replace the fixed-offset cell layout with a slotted page format that supports variable-length records using an indirection layer — a slot directory.

## What It Teaches
- **Indirection via slot directory**: Instead of computing a record's position as `header_size + cell_index * cell_size`, the page maintains an array of (offset, length) pairs. This decouples logical cell order from physical storage position.
- **Bidirectional growth**: Slots grow from the top of the page; records grow from the bottom. Free space is the gap in the middle. This is the exact layout used by PostgreSQL and SQLite.
- **Space management**: The page tracks `free_start` (end of slot array) and `free_end` (start of record area). A record fits if `free_end - free_start >= record_size + slot_size`.
- **Record reordering without data movement**: To delete or reorder records, you only change the slot directory — the actual record data doesn't move. This makes compaction and reorganization efficient.

## Page Layout

```
┌──────────────────────────────────────────────────┐
│ Page Header (8 bytes)                            │
│  [type:1][slot_count:2][free_start:2][free_end:2]│
├──────────────────────────────────────────────────┤
│ Slot 0: [offset:2][length:2]                     │
│ Slot 1: [offset:2][length:2]                     │
│ ← free_start                                     │
│              ... free space ...                   │
│                            free_end →             │
│ Record 1: [data...]                              │
│ Record 0: [data...]                              │
└──────────────────────────────────────────────────┘
```

## Learning Objectives
1. Define the slotted page header structure (type, slot_count, free_start, free_end).
2. Implement `page_insert_record()` that writes a record at `free_end` and adds a slot entry at `free_start`.
3. Implement `page_read_record()` that reads a record by slot index using the slot directory.
4. Track free space correctly as records are inserted.
5. Implement the `pager dump-page <N>` debug command to inspect slot structure.

## Debug Command: `pager dump-page <N>`

```
[PAGER] Page 0: type=LEAF slots=3 free_space=3520
[PAGER]   Slot 0: offset=4078 length=22
[PAGER]   Slot 1: offset=4056 length=22
[PAGER]   Slot 2: offset=4030 length=26
```

## How to Run
```bash
make test-c-stage12
```
