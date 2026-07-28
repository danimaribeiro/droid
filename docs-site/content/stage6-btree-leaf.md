---
stage: 6
title: "B+Tree Leaf Node & INSERT Execution"
subtitle: "Architecting leaf node page layouts and executing end-to-end relational table insertions"
section: "The B-Tree Storage Engine"
objective: "Define the binary storage layout of a B+Tree leaf node inside 4KB memory pages and wire the query executor to insert serialized table tuples end-to-end."
concepts:
  - "The architectural distinction between classical B-Trees and high-performance B+Trees"
  - "Designing a self-contained 4KB Page Header and Cell array (key + serialized tuple)"
  - "Wiring INSERT execution from AST statements down to physical memory insertion"
  - "Inspecting internal page topology via 'btree dump [page]' diagnostic instrumentation"
algorithms:
  - title: "B+Tree Leaf Node Initialization"
    description: "When page zero (or any freshly minted page from the Pager) is designated as a leaf in our B+Tree index, its initial bytes must be stamped with a standardized binary header."
    steps:
      - "Retrieve the designated 4KB page buffer pointer from the Pager via 'pager get <N>' or 'pager alloc'."
      - "At the very first memory address (offset 0), write the unsigned integer flag representing node type LEAF."
      - "At the following header offset, initialize the cell counter (num_cells) directly to zero."
      - "If this node represents the uppermost base of the table, set the boolean flag indicating it acts as the root node."
  - title: "End-to-End INSERT & Cell Packing"
    description: "When an incoming INSERT SQL query arrives at the execution engine, the logical values must traverse the entire storage pipeline to reside safely inside a leaf node cell."
    steps:
      - "Receive the validated AST Insert Statement from the Parser containing target operands (id, name, email)."
      - "Invoke Row Serialization (Stage 4) to pack the logical field operands into a standardized 60-byte binary row payload."
      - "Access the target B+Tree leaf node page via the Pager and identify the current cell occupancy count."
      - "Calculate the target memory offset for the new cell based on header dimensions plus (num_cells * cell_size)."
      - "Write the 32-bit integer primary key (id) at the cell boundary, immediately followed by copying the serialized 60-byte row payload."
      - "Increment the node's internal num_cells counter by 1 and confirm execution without printing raw error codes."
checklist:
  - "Define leaf node header layout constants (Node Type, Root Flag, Cell Count offsets)"
  - "Define leaf cell dimensions: Key Size (4 bytes) plus Row Payload Size (60 bytes) equal 64 bytes"
  - "Calculate leaf page maximum capacity (~63 cells per 4096-byte memory page)"
  - "Implement leaf page initialization logic to stamp empty LEAF nodes cleanly"
  - "Connect executor engine to route INSERT statements directly into leaf node cell slots"
  - "Implement 'btree dump [page]' diagnostic command to display node type, cell occupancy, and primary keys"
  - "Support default 'btree dump' invocation without numeric arguments to automatically inspect root page 0"
  - "Protect dump routines against out-of-bounds page requests with clean error handling"
---

## Why a B+Tree instead of a Standard B-Tree?

Throughout classical database architecture textbooks, indexes are universally described under the generic title of "B-Trees." However, relational database systems engineered for production storage — including PostgreSQL, MySQL InnoDB, and SQLite — rely almost exclusively on a specialized variant known as a **B+Tree** (*B-Plus Tree*). 

Why is the **+ (Plus)** architecture indispensable for relational database performance?

```
CLASSICAL B-TREE (Payloads Scattered Everywhere):
                   ┌───────────────────────────────────────┐
                   │ Key: 10 [Full 60-byte User Row Data]  │  <-- Heavy Root!
                   └───────────────────┬───────────────────┘
                           ┌───────────┴───────────┐
              ┌────────────▼────────────┐     ┌────▼────────────────────┐
              │ Key: 5 [Full Row Data]  │     │ Key: 20 [Full Row Data] │
              └─────────────────────────┘     └─────────────────────────┘

B+TREE ARCHITECTURE (Our Relational Engine Design):
                   ┌───────────────────────────────────────┐
                   │    Internal Node: [ Routing Key: 10 ] │  <-- Compact (No Data)
                   └───────────────────┬───────────────────┘
                           ┌───────────┴───────────┐
              ┌────────────▼────────────┐     ┌────▼────────────────────┐
              │ LEAF: Key 5  [Payload]  │     │ LEAF: Key 10 [Payload]  │
              │       Key 8  [Payload]  │     │       Key 20 [Payload]  │
              └─────────────────────────┘     └─────────────────────────┘
```

1. **Massive Root Fan-Out (High Branching Factor)**: In a classical B-Tree, every single node in the hierarchy stores both the indexing Key and the complete Row Payload. This consumes valuable memory bandwidth, forcing the tree to grow extremely deep. In our **B+Tree**, Internal Nodes store exclusively compact 4-byte keys and lightweight page pointers. A single 4KB internal page can route query traffic across hundreds of branching child paths!
2. **Predictable Query Latency**: Because full table records live strictly inside the bottom-most **Leaf Nodes**, every point query traverses the exact same depth from root to leaf, providing deterministic O(log N) runtime execution.

## Anatomy of a 4KB Leaf Node Page

In this initial B+Tree stage, our database begins as a single root leaf node residing within **Page #0** of our Buffer Pool. To transform a raw 4096-byte memory buffer from the Pager into an organized structured node, we partition the block into two logical areas: a fixed **Node Header** and an array of **Cells**.

```
  0x0000 ┌──────────────────────────────────────────────────────────┐
         │ NODE HEADER: [ Type = LEAF ] [ Is Root ] [ Num Cells ]   │
         ├──────────────────────────────────────────────────────────┤
         │ CELL #0:  [ Key = 1  (4 bytes) ] [ Row Data (60 bytes) ] │
         ├──────────────────────────────────────────────────────────┤
         │ CELL #1:  [ Key = 2  (4 bytes) ] [ Row Data (60 bytes) ] │
         ├──────────────────────────────────────────────────────────┤
         │                       ...                                │
         ├──────────────────────────────────────────────────────────┤
         │ CELL #62: [ Key = 42 (4 bytes) ] [ Row Data (60 bytes) ] │
         ├──────────────────────────────────────────────────────────┤
         │ UNUSED MEMORY SPACE (Tail Padding up to 4096 bytes)      │
  0x1000 └──────────────────────────────────────────────────────────┘
```

#### Declarative Mermaid Layout View
```mermaid
graph TD
    classDef header fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#38bdf8;
    classDef cell fill:#0f172a,stroke:#34d399,stroke-width:2px,color:#a7f3d0;
    classDef free fill:#1e293b,stroke:#64748b,stroke-dasharray: 4 4,color:#94a3b8;

    H["📑 NODE HEADER: [ Type: LEAF (0x00) | Is Root | Num Cells ]"] ::: header
    C0["📦 CELL #0: [ Key = 1 (4 bytes) | Row Payload (60 bytes) ] = 64B"] ::: cell
    C1["📦 CELL #1: [ Key = 2 (4 bytes) | Row Payload (60 bytes) ] = 64B"] ::: cell
    CMAX["📦 ... Capacity Supports up to ~63 Sequential Cells"] ::: cell
    FREE["⬜ Unoccupied Tail Padding (Up to 4096 bytes total Buffer Pool page size)"] ::: free

    H --> C0
    C0 --> C1
    C1 --> CMAX
    CMAX -.- FREE
```

When an `INSERT INTO users` statement arrives, your execution engine serializes the 60-byte row, asks the Pager for Leaf Page 0, locates the offset of index `num_cells`, deposits the 4-byte key and 60-byte payload into the 64-byte cell slot, and increments the cell count. At this stage, your B+Tree leaf node is officially storing live relational data!
