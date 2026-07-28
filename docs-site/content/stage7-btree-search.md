---
stage: 7
title: "B+Tree Search & SELECT Execution"
subtitle: "Implementing logarithmic leaf node search, sorted primary key insertion, and cursor-driven table scans"
section: "The B-Tree Storage Engine"
objective: "Upgrade B+Tree leaf nodes to enforce strictly sorted primary key insertion via binary search, catch duplicate key violations, and implement cursor-driven SELECT scan iteration."
concepts:
  - "Executing logarithmic O(log N) binary search across tightly packed leaf node cells in RAM"
  - "Enforcing sorted cell ordering by dynamically shifting overlapping memory structures"
  - "Detecting and gracefully rejecting duplicate primary key insertion attempts"
  - "Designing the Table Cursor abstraction to drive sequential pull-based SELECT query executions"
algorithms:
  - title: "Logarithmic Binary Search & Duplicate Detection"
    description: "To locate an existing primary key or determine the precise insertion slot for a new row without checking every cell linearly, execute binary search within the leaf page."
    steps:
      - "Establish search bounds with left index initialized to 0 and right index initialized to num_cells - 1."
      - "While left index is less than or equal to right index, compute the midpoint cell index (left + (right - left) / 2)."
      - "Extract the 32-bit primary key stored at the midpoint cell offset inside the leaf node buffer."
      - "If the target key equals the midpoint key, the key is found! Return this exact cell index (or flag an ERROR if trying to insert a duplicate)."
      - "If the target key is less than the midpoint key, narrow the search window by shifting the right boundary to midpoint - 1."
      - "If the target key is greater than the midpoint key, advance the left boundary to midpoint + 1."
      - "When loop terminates without a match, the current left boundary index represents the exact sequential insertion point where the new key belongs!"
  - title: "Sorted Cell Insertion via Memory Shift"
    description: "When inserting a primary key that belongs somewhere in the middle of existing cells (e.g., inserting key 2 when keys 1 and 3 already exist), existing cells must shift rightwards."
    steps:
      - "Execute binary search on the target leaf node to determine the destined cell index for the incoming row."
      - "If the target index already contains the exact same key, abort immediately and report a duplicate primary key error."
      - "If the insertion index is strictly less than the current num_cells, calculate the total number of bytes currently occupied by all subsequent cells to the right."
      - "Shift those subsequent cells rightward by exactly one full cell dimension (64 bytes) using an overlapping memory move operation."
      - "Deposit the new 4-byte primary key and 60-byte serialized row payload into the newly vacated sequential cell slot and increment num_cells."
  - title: "Table Cursor & SELECT Query Scanning"
    description: "When evaluating a 'SELECT * FROM users;' query, the executor iterates sequentially over table records without exposing raw page pointers directly to the SQL engine."
    steps:
      - "Initialize a table Cursor struct positioned at the very first record (Page 0, Cell Index 0)."
      - "Evaluate if the cursor has reached the end of table condition (when current cell index equals the node's num_cells)."
      - "While the end-of-table flag is false, fetch the pointer to the current cell via the Pager."
      - "Pass the payload section of the current cell to Row Deserialization (Stage 4) to reconstruct logical text fields."
      - "Print the formatted table header, output the reconstructed row attributes, advance cursor index by +1, and print total row counts at termination."
checklist:
  - "Implement binary search algorithm within leaf node cells to guarantee O(log N) key lookup"
  - "Wire sorted insertion logic to shift existing memory cells rightwards when inserting out of order"
  - "Enforce primary key uniqueness by returning clean error codes upon duplicate key insertion"
  - "Implement 'btree find <key>' diagnostic command to display search outcome, cell coordinates, and decoded row fields"
  - "Design Table Cursor abstraction to encapsulate sequential scanning over leaf node records"
  - "Wire executor engine to handle SELECT statements by iterating table cursors and printing relational table formatting"
  - "Verify clean SELECT output on freshly initialized tables returning '(0 rows)'"
---

## Why Sorted Insertion is Critical for B+Trees

In our previous stage, incoming cells were appended directly to the end of the leaf page in the chronological order of arrival. While fast for initial writing, unsorted pages degrade table searches into linear O(N) scans. Furthermore, when an overflowing B+Tree leaf node must split in two during Stage 8, calculating a clean median dividing line is impossible unless cells are maintained in strictly sorted numerical order!

When inserting an out-of-order key (for example, inserting **Key 2** into a page currently holding **Key 1** and **Key 3**), our engine utilizes binary search to locate Index #1 as the insertion target. It then safely shifts all cells from Index #1 onward to Index #2, opening a pristine, gapless 64-byte insertion slot:

```
BEFORE INSERTING KEY 2 (Unshifted Page Memory):
┌──────────┬───────────┬───────────┬────────────────────────────────────┐
│  HEADER  │ CELL #0:  │ CELL #1:  │ (Unoccupied free memory space)     │
│ cells=2  │ Key = 1   │ Key = 3   │                                    │
└──────────┴───────────┴───────────┴────────────────────────────────────┘
                              │
                              ▼  (Memory shift rightwards by 1 cell / 64 bytes)
AFTER MEMORY SHIFT & INSERTION (Sorted Page Memory):
┌──────────┬───────────┬───────────┬───────────┬────────────────────────┐
│  HEADER  │ CELL #0:  │ CELL #1:  │ CELL #2:  │ (Remaining free space) │
│ cells=3  │ Key = 1   │ Key = 2   │ Key = 3   │                        │
└──────────┴───────────┴───────────┴───────────┴────────────────────────┘
```

#### Declarative Mermaid Memory Shift View
```mermaid
flowchart TD
    subgraph BEFORE [Unshifted Memory State]
        B0["Index 0: Key 1"] --> B1["Index 1: Key 3"]
    end

    subgraph AFTER [Sorted Memory State After 64-Byte Shift]
        A0["Index 0: Key 1"] --> A1["Index 1: Key 2 🎉 Inserted"] --> A2["Index 2: Key 3 🔄 Shifted +64 Bytes"]
    end

    B1 -.-|Memory shift rightwards by 1 cell / 64 bytes| A2

    style B0 fill:#1e293b,stroke:#475569,stroke-width:2px,color:#f8fafc
    style B1 fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#fde68a
    style A0 fill:#1e293b,stroke:#475569,stroke-width:2px,color:#f8fafc
    style A1 fill:#065f46,stroke:#34d399,stroke-width:2px,color:#a7f3d0
    style A2 fill:#1e1e2e,stroke:#6366f1,stroke-width:2px,color:#c7d2fe
```

## The Table Cursor Abstraction

To cleanly divorce high-level query planning from low-level page math, relational database engines utilize an abstraction called a **Table Cursor**. Rather than letting the SELECT execution loop directly tamper with raw Buffer Pool pointers, a Cursor acts as a logical navigator pointing to a distinct record position:

1. **Start of Table**: Positioned at Page #0, Cell #0.
2. **Cursor Advance**: Moves forward by incrementing the cell index. In future stages, when a cursor reaches the final cell of a leaf page, it automatically follows the node's sibling pointer to transition smoothly onto the next sequential leaf!
3. **End of Table Detection**: Reaches completion when the cursor attempts to read a cell index matching the total number of valid records in the active table or node.

Using cursors guarantees that your `SELECT * FROM users;` implementation remains perfectly stable and decoupled from internal memory layouts, even as your B+Tree begins expanding across hundreds of interconnected memory pages!
