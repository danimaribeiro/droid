---
stage: 10
title: "Persistence & WHERE Clause"
subtitle: "Making data survive across sessions and filtering rows with conditional expressions"
section: "Persistence & Query Execution"
objective: "Implement durable file-backed storage so inserted data persists across program restarts, introduce the --db flag for database file control, and add WHERE clause evaluation for conditional row filtering."
concepts:
  - "Flushing in-memory Buffer Pool pages to a physical database file on disk via db_close()"
  - "Reconstructing page inventory from an existing database file during db_open() using file size arithmetic"
  - "Controlling database file paths via the --db CLI flag for session isolation and testing"
  - "Evaluating WHERE clause expressions against deserialized row fields during cursor traversal"
algorithms:
  - title: "Page Flush & Durable Close Protocol"
    description: "When the user exits the REPL or the program terminates, all modified in-memory pages must be written to disk before releasing resources."
    steps:
      - "Iterate over every allocated page slot in the Buffer Pool cache array (indices 0 through num_pages - 1)."
      - "For each non-null page pointer, invoke a write system call to serialize the raw 4096-byte memory block to the correct file offset: page_num × PAGE_SIZE."
      - "After all pages are flushed, close the file descriptor and free all allocated page memory buffers."
      - "On the next program startup, the database file will contain the complete B+Tree structure ready for reconstruction."
  - title: "File-Based Page Reconstruction on Open"
    description: "When opening an existing database file, the Pager must detect how many pages were previously written and prepare the cache accordingly."
    steps:
      - "Open the database file using a read-write file descriptor (creating the file if it does not exist)."
      - "Query the file size using fseek/ftell or fstat system calls."
      - "Calculate num_pages = file_size / PAGE_SIZE. This instantly reconstructs the page inventory without scanning individual records."
      - "When a page is requested via pager_get_page(N), check the cache first. On a CACHE_MISS, read PAGE_SIZE bytes from offset N × PAGE_SIZE into a freshly allocated buffer."
  - title: "WHERE Clause Filter Evaluation"
    description: "During SELECT execution, each row produced by the cursor must be tested against the WHERE predicate before being included in the result set."
    steps:
      - "Parse the WHERE clause during SQL parsing (Stage 3) to extract the column name, comparison operator, and target value."
      - "During cursor traversal, deserialize each row from its leaf cell into a Row struct."
      - "Compare the specified row field against the WHERE value: for integer columns (id), perform uint32_t equality; for string columns (name, email), use strcmp."
      - "If the comparison matches, include the row in the output. If not, skip to the next cell via cursor_advance()."
checklist:
  - "Implement db_close() to flush all cached pages to disk and release file descriptors"
  - "Implement file-based db_open() that detects existing pages from file size"
  - "Implement pager_get_page() disk read path for CACHE_MISS scenarios"
  - "Add --db <path> CLI flag to control which database file is used"
  - "Support -c mode combined with --db for non-interactive multi-session testing"
  - "Implement WHERE clause evaluation for integer equality (id = N)"
  - "Implement WHERE clause evaluation for string equality (name = 'value')"
  - "Verify cross-session persistence: insert in session 1, query in session 2"
  - "Verify database file isolation: separate --db paths contain independent data"
---

## From Volatile Memory to Durable Storage

Up to Stage 8, our database engine has been a purely in-memory affair. Every INSERT, every carefully balanced B+Tree split, every meticulously sorted leaf node — all of it vanishes the instant the user types `.exit`. In production databases, this would be catastrophic. Users expect their data to survive power failures, program restarts, and system reboots.

In this stage, we bridge the gap between volatile RAM and durable disk storage by implementing a complete **persistence layer**. The core insight is elegantly simple: since our Pager already manages data in uniform 4KB pages, writing those pages to a file is a straightforward block copy operation.

```mermaid
flowchart LR
    subgraph Session1["📝 Session 1 (Write)"]
        I1["INSERT id=1 'alice'"]
        I2["INSERT id=2 'bob'"]
        EXIT[".exit"]
        FLUSH["db_close() flushes\nall pages to disk"]
        I1 --> I2 --> EXIT --> FLUSH
    end

    subgraph DiskFile["💾 droid.db"]
        P0["Page 0: 4KB"]
        P1["Page 1: 4KB"]
        P2["Page 2: 4KB"]
    end

    subgraph Session2["📖 Session 2 (Read)"]
        SEL["SELECT * FROM users;"]
        R1["→ id=1 alice"]
        R2["→ id=2 bob"]
        ROWS["(2 rows)"]
        SEL --> R1 --> R2 --> ROWS
    end

    FLUSH --> DiskFile
    DiskFile --> SEL

    style Session1 fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#d8b4fe
    style Session2 fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#a7f3d0
    style DiskFile fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fde68a
```

## The db_close() Flush Protocol

When the user exits the REPL, `db_close()` must guarantee that every modified page in the Buffer Pool is written to the database file before the process terminates. This is the fundamental durability contract:

1. **Iterate** through every page slot in the cache array
2. **Write** each non-null page to its correct file offset: `page_num × PAGE_SIZE`
3. **Close** the file descriptor and free memory

The write offset calculation is critical: Page 0 starts at byte 0, Page 1 at byte 4096, Page 2 at byte 8192, and so forth. Since every page is exactly 4096 bytes, the file becomes a perfectly aligned sequence of raw page images.

## Reconstructing the B+Tree from Disk

When `db_open()` encounters an existing database file, it must reconstruct the Pager state without scanning individual rows:

```mermaid
flowchart TD
    FileSize["📁 droid.db — File size: 12288 bytes"]
    Calc["num_pages = 12288 / 4096 = 3 pages"]
    FileSize --> Calc
    Calc --> P0["Page 0: INTERNAL node (root)\nContains routing keys"]
    Calc --> P1["Page 1: LEAF node (left child)\nContains sorted cells"]
    Calc --> P2["Page 2: LEAF node (right child)\nContains sorted cells"]

    style FileSize fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fde68a
    style Calc fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#d8b4fe
    style P0 fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#d8b4fe
    style P1 fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#a7f3d0
    style P2 fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#a7f3d0
```

The beauty of our page-based architecture is that the entire B+Tree structure — node types, cell arrays, routing keys, sibling pointers — is encoded directly in the raw page bytes. No separate index file or reconstruction pass is needed!

## The --db Flag: Database File Control

To support automated testing and database isolation, the engine must accept a `--db <path>` CLI flag:

```bash
./c-db                            # uses default "droid.db"
./c-db --db /tmp/mytest.db        # uses specified path
./c-db --db /tmp/test.db -c "select * from users;"
```

This flag enables multi-session persistence tests where Session 1 inserts data and Session 2 verifies it survived, each using the same `--db` path pointing to a temporary file.

## WHERE Clause: Conditional Row Filtering

The WHERE clause transforms our SELECT from a brute-force full table dump into a precision surgical query tool. The evaluation logic differs based on the filtered column:

* **Primary Key Filter** (`WHERE id = N`): Since the id is the B+Tree key, this could theoretically use `btree_find()` for O(log n) lookup. In this stage, we implement the simpler approach of filtering during cursor traversal. Stage 10 will optimize this with the Query Planner.

* **Non-Key Filter** (`WHERE name = 'alice'`): There is no index on the `name` column, so the engine must perform a sequential scan through all leaf cells, deserializing each row and comparing the `name` field via `strcmp()`.

```mermaid
flowchart LR
    Q["SELECT * FROM users\nWHERE name = 'bob'"]
    C0["Cell 0\nid=1 name='alice'\nstrcmp ≠ 0 → SKIP ❌"]
    C1["Cell 1\nid=2 name='bob'\nstrcmp = 0 → OUTPUT ✅"]
    C2["Cell 2\nid=3 name='charlie'\nstrcmp ≠ 0 → SKIP ❌"]
    R["Result: (1 rows)"]

    Q --> C0 --> C1 --> C2 --> R

    style Q fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#d8b4fe
    style C0 fill:#7f1d1d,stroke:#f87171,stroke-width:2px,color:#fca5a5
    style C1 fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#a7f3d0
    style C2 fill:#7f1d1d,stroke:#f87171,stroke-width:2px,color:#fca5a5
    style R fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#a7f3d0
```
