---
stage: 8
title: "B+Tree Splits & Internal Nodes"
subtitle: "Handling leaf page overflows, dynamic node splitting, and hierarchical internal routing nodes"
section: "The B-Tree Storage Engine"
objective: "Implement leaf page overflow detection, execute clean median node splits in our B+Tree, promote routing keys to internal nodes, and support deep tree search after splits."
concepts:
  - "Detecting memory page overflow conditions when exceeding 4KB leaf cell capacity limits"
  - "Executing clean B+Tree leaf splits while retaining full row payloads strictly within bottom leaf nodes"
  - "Architecting Internal Nodes designed with routing separator keys and lightweight page child pointers"
  - "Visualizing deep multi-level tree hierarchies using dynamic 'btree structure' diagnostic instrumentation"
algorithms:
  - title: "Leaf Overflow & Median Splitting Protocol"
    description: "When an insertion arrives at a leaf node that has reached maximum capacity (all cells occupied), the node must split into two halves before accepting further data."
    steps:
      - "Allocate a completely new empty page from the Pager via 'pager alloc' and initialize it with node type LEAF."
      - "Calculate the precise median cell division index dividing existing records into Left and Right halves."
      - "Copy the upper half of existing cells from the original overflowing leaf over to index zero of the newly minted Right leaf node."
      - "Adjust the cell counters (num_cells) on both the original Left leaf and new Right leaf to reflect their newly halved inventories."
      - "Update the 'next_leaf' sibling pointers to chain the Left leaf directly to the Right leaf, preserving horizontal linked-list traversal for full table scans (SELECT *)."
      - "Identify the very first primary key of the new Right leaf node to act as our promoted routing separator key in the parent internal node!"
  - title: "Root Node Split & Tree Growth"
    description: "When the overflowing leaf happens to be Root Page 0, the B+Tree grows upward by spawning an Internal Root node."
    steps:
      - "Allocate two new child pages in the Pager (e.g., Page 1 and Page 2)."
      - "Copy the original contents of Page 0 into Left Child Page 1 and execute the median split transferring the upper half into Right Child Page 2."
      - "Convert Root Page 0 from type LEAF into type INTERNAL and increment overall tree depth by 1."
      - "In the Internal Root node header, set the first child pointer to Left Child Page 1, write the promoted separator key, and assign the Rightmost Child Pointer to Right Child Page 2."
  - title: "Internal Node Routing & Multi-Level Search"
    description: "With an Internal Node holding routing keys, point evaluations ('btree find') must first cascade down the branches before examining individual leaf cells."
    steps:
      - "Begin evaluation at Root Page 0; inspect the node type header to check if the current page is LEAF or INTERNAL."
      - "If the node type is INTERNAL, scan its array of separator routing keys to find the first key greater than our desired search target."
      - "If the search target is strictly less than the routing separator key, follow the corresponding left child page pointer down into the Buffer Pool."
      - "If the search target is greater than or equal to all separator keys, follow the dedicated Rightmost Child Pointer to descend into the rightmost subtree."
      - "Repeat the hierarchical descent until encountering a node of type LEAF, at which point invoke our standard logarithmic binary search from Stage 7!"
checklist:
  - "Define internal node header layout constants (Node Type, Number of Keys, Rightmost Child Pointer)"
  - "Calculate leaf overflow thresholds where cell occupancy forces a structural tree split"
  - "Implement leaf splitting routine to divide cell buffers cleanly across sibling pages without data loss"
  - "Link sibling leaf pages via a next_leaf pointer to support sequential table scans across page boundaries"
  - "Implement parent routing key promotion while keeping authentic table records securely inside leaf nodes"
  - "Upgrade search routines ('btree find' and SELECT cursors) to cascade correctly down internal routing branches"
  - "Verify ascending record ordering during SELECT operations even when records are inserted in reverse chronological order (ids 10 down to 1)"
  - "Implement 'btree structure' diagnostic command to display tree depth, internal node keys, and child leaf distributions"
  - "Validate sustained structural stability during massive multi-split workloads (inserting 30+ sequential records)"
---

## The B+Tree Split: Retaining Payloads in Leaves

One of the most profound behavioral differences between a standard B-Tree and our high-performance **B+Tree** is manifested during node splitting. 

In a conventional B-Tree, when a node overflows and fractures in half, the median table record is physically stripped from the leaf and pushed up into the parent internal node. While mathematically sound for simple in-memory binary trees, scattering complex user records across upper index branches ruins relational storage performance, destroying the ability to run rapid sequential range scans!

In our **B+Tree storage engine**, table tuples are sacred citizens of the bottom leaf tier:

```
OVERFLOWING SINGLE LEAF NODE (Page #0 reaching capacity limit):
┌─────────────────────────────────────────────────────────────────────────┐
│ [Key:1 | Payload] [Key:2 | Payload] ... [Key:7 | Payload] [Key:8 Incoming]│
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼  (B+Tree Split: Promote routing COPY only!)
NEW TREE HIERARCHY (Depth: 2):
                       ┌─────────────────────────────┐
                       │ INTERNAL ROOT (Page #0):    │
                       │ [ Child Ptr: Page 1 ]       │
                       │ [ Separator Key: 5  ]       │
                       │ [ Rightmost Ptr: Page 2 ]   │
                       └──────────────┬──────────────┘
              ┌───────────────────────┴───────────────────────┐
              ▼ (Keys < 5)                                    ▼ (Keys >= 5)
┌─────────────────────────────┐                 ┌─────────────────────────────┐
│ LEAF NODE (Left Child #1):  │                 │ LEAF NODE (Right Child #2): │
│ [Key:1|Data] [Key:2|Data]   │                 │ [Key:5|Data] [Key:6|Data]   │
│ [Key:3|Data] [Key:4|Data]   │                 │ [Key:7|Data] [Key:8|Data]   │
└─────────────────────────────┘                 └─────────────────────────────┘
```

#### Declarative Mermaid Tree Hierarchy
```mermaid
graph TD
    Root["🗂️ INTERNAL ROUTING NODE (Root Page 0)<br/>Promoted Separator Key: 5 | Depth: 2"]
    LeftLeaf["🍃 LEAF NODE (Child Page 1)<br/>• Key 1 Row Payload 60B<br/>• Key 2 Row Payload 60B<br/>• Key 4 Row Payload 60B"]
    RightLeaf["🍃 LEAF NODE (Child Page 2)<br/>• Key 5 Row Payload 60B<br/>• Key 7 Row Payload 60B<br/>• Key 8 Row Payload 60B"]
    
    Root -->|Keys less than 5| LeftLeaf
    Root -->|Keys greater or equal to 5| RightLeaf

    style Root fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#d8b4fe,rx:8px,ry:8px
    style LeftLeaf fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#a7f3d0,rx:6px,ry:6px
    style RightLeaf fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#a7f3d0,rx:6px,ry:6px
```

Notice how **Key 5** appears twice in our new architecture:
1. It resides inside **Right Child Page 2** as a genuine table cell holding the authentic user row payload for user #5.
2. A compact **copy** of Key 5 (just the 4-byte integer, stripped of its 60-byte text payload) is promoted upward into the newly born **Internal Root Node** to act as a lightweight traffic director!

## Anatomy of an Internal Routing Node

When Root Page 0 transitions from an overflowing leaf into an **Internal Node**, its memory layout shifts dramatically. It ceases to hold user text records and instead dedicates its 4KB buffer exclusively to routing components:

* **Node Type Flag**: Marked as `INTERNAL` (0x02) to notify query cursors to branch downward rather than evaluating text payloads.
* **Number of Keys Counter**: Tracks how many dividing separator keys currently populate the routing table.
* **Rightmost Child Pointer**: An integer specifying the Buffer Pool Page ID of the rightmost child branch (used whenever a search query requests a key greater than all separator values).
* **Routing Cell Array**: A hyper-dense sequence of paired integer attributes: `[ Child Page Pointer (4 bytes) | Separator Key (4 bytes) ]`. Because each routing entry consumes merely 8 bytes, a single internal page can direct query traffic across hundreds of distinct child branches!

## Sequential Allocation & Sibling Linking

During a leaf node split, allocating the **Left Child** first and the **Right Child** second is highly recommended to maintain strict physical sequential order in the database file (e.g., Page 1 followed immediately by Page 2 on disk). When the OS reads the file sequentially, preserving this physical ordering triggers hardware-level **Read-Ahead Caching**, vastly accelerating `SELECT *` scans!

Equally important is the `next_leaf` pointer (Offset 6 in our leaf headers). When a node fractures in two, the original Left leaf must securely chain its `next_leaf` pointer to the newly minted Right leaf. This invisible linked list spans across the bottom of the B+Tree, allowing full table scans to hop horizontally from leaf to leaf without continually traversing down from the root!

## Multi-Split Scalability

When users invoke massive data ingestion pipelines (such as our integration tests inserting 30 or more sequential user tuples), your B+Tree dynamically repeats the median split protocol. As child leaves continue overflowing, they send additional separator keys upward into their parent internal nodes. 

Through this elegant, self-balancing mechanics, your B+Tree storage engine maintains uniform tree depth across all branches, guaranteeing logarithmic lookups and reliable sequential table scans no matter how millions of relational records are inserted!
