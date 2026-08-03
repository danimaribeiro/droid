---
stage: 9
title: "B+Tree Internal Node Splits"
subtitle: "Recursive splitting of internal routing nodes to grow the tree without limits"
section: "The B+Tree Storage Engine"
objective: "Implement recursive internal node splitting so the B+Tree can grow to arbitrary depth, eliminating all insertion limits and ensuring INSERT and SELECT work correctly for any number of rows."
concepts:
  - "Detecting internal node overflow when the routing cell array exceeds its maximum key capacity"
  - "Splitting an internal node into two halves and promoting the median key to the parent node"
  - "Recursive split propagation: when the parent internal node is also full, it splits upward until reaching the root"
  - "Root internal node split: allocating two new internal children and keeping the root at Page 0"
  - "Expanding the Buffer Pool to support deeper trees with more pages"
algorithms:
  - title: "Internal Node Overflow Detection"
    description: "After a leaf split promotes a new separator key into the parent internal node, the parent must check whether it has exceeded its maximum key capacity."
    steps:
      - "Calculate the maximum number of keys an internal node can hold: INTERNAL_NODE_MAX_KEYS = (PAGE_SIZE - INTERNAL_NODE_HEADER_SIZE) / INTERNAL_NODE_KEY_AND_CHILD_SIZE."
      - "After inserting a new key-child pair into the internal node, compare num_keys against INTERNAL_NODE_MAX_KEYS."
      - "If num_keys exceeds the limit, invoke internal_node_split() on the overflowing internal node."
  - title: "Internal Node Split Protocol"
    description: "Splitting an internal node follows a similar pattern to leaf splitting, but with key differences in how the median key is handled."
    steps:
      - "Calculate the median index: mid = num_keys / 2."
      - "The median key is NOT copied to both children — it is extracted and promoted upward to the parent."
      - "Allocate a new right internal page and copy the upper half of keys (indices mid+1 through num_keys-1) and their child pointers into it."
      - "Transfer the right_child pointer from the original node to become the right_child of the new right internal node."
      - "Update the original node: set num_keys to mid, and set its right_child to the left child pointer of the median key cell."
      - "Promote the median key and the new right internal page number into the parent node via internal_node_insert()."
  - title: "Recursive Split Propagation"
    description: "When promoting a key into the parent causes the parent to also overflow, the split process recurses upward through the tree."
    steps:
      - "After internal_node_insert() adds the promoted key to the parent, check if the parent now exceeds INTERNAL_NODE_MAX_KEYS."
      - "If so, recursively call internal_node_split() on the parent node."
      - "This recursion continues upward until either a non-full parent absorbs the key, or the root itself must split."
      - "When the root internal node splits, allocate two new child internal pages, move the halves into them, and reinitialize Page 0 as a new root with a single key pointing to the two new children."
  - title: "Root Internal Node Split"
    description: "When the root internal node overflows, the tree grows one level deeper."
    steps:
      - "Allocate a left internal child page and copy the lower half of keys and child pointers."
      - "Allocate a right internal child page and copy the upper half of keys and child pointers."
      - "Extract the median key from between the two halves."
      - "Reinitialize Page 0 as a fresh internal node with num_keys=1, the median key as cell 0, the left child pointer, and right_child pointing to the right page."
      - "The tree depth increases by 1, and all existing leaf pages remain untouched at the bottom."
checklist:
  - "Define INTERNAL_NODE_MAX_KEYS constant based on page size and cell layout"
  - "Implement internal_node_split() to divide an overflowing internal node into two halves"
  - "Handle root internal node split: keep Page 0 as root, allocate two new internal children"
  - "Handle non-root internal node split: promote median key into parent via internal_node_insert()"
  - "Implement recursive split propagation when parent nodes also overflow"
  - "Track parent_page_num through the internal node hierarchy for upward key promotion"
  - "Expand TABLE_MAX_PAGES if needed to accommodate deeper trees"
  - "Verify btree structure output shows correct multi-level hierarchy after many insertions"
  - "Verify SELECT returns all rows in sorted order after hundreds of insertions"
  - "Verify btree find locates every inserted key correctly across tree depths of 3 or more"
---

## Beyond Two Levels: Breaking the Internal Node Limit

In Stage 8, we implemented leaf node splitting and created our first internal routing nodes. But there was a hidden limitation: the internal node could accumulate an unlimited number of separator keys without ever splitting itself. For small datasets (under ~100 rows), this works fine — a single internal node can hold enough routing keys. But as the dataset grows, the internal node eventually runs out of space in its 4KB page.

In production databases, a B+Tree must grow to arbitrary depth to handle millions of rows. This stage implements the missing piece: **recursive internal node splitting**.

## The Internal Node Capacity Problem

Each internal node cell consumes 8 bytes (4-byte child pointer + 4-byte separator key). With a 4KB page and a 10-byte header, the maximum number of keys in a single internal node is:

```
INTERNAL_NODE_MAX_KEYS = (4096 - 10) / 8 = 510 keys
```

With 510 keys, a single internal node can point to 511 child leaf pages. Each leaf holds up to 8 rows, giving us a theoretical maximum of **4,088 rows** in a depth-2 tree. Beyond that, we need depth 3, 4, and deeper.

## How Internal Node Split Differs from Leaf Split

The critical difference between splitting a leaf and splitting an internal node is how the **median key** is handled:

```mermaid
flowchart TD
    subgraph LeafSplit["🍃 Leaf Split (Stage 8)"]
        LS1["Median key is COPIED"]
        LS2["Original stays in right leaf"]
        LS3["Copy goes up to parent"]
    end

    subgraph InternalSplit["🗂️ Internal Node Split (Stage 9)"]
        IS1["Median key is EXTRACTED"]
        IS2["Removed from both children"]
        IS3["Moves up to parent exclusively"]
    end

    style LeafSplit fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#a7f3d0
    style InternalSplit fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#d8b4fe
```

In a **leaf split**, the median key remains in the right leaf (because leaf cells hold actual row data that must be preserved) and a copy is promoted to the parent.

In an **internal split**, the median key is **extracted** from the node — it moves exclusively into the parent. Internal nodes only hold routing keys, not row data, so no duplication is necessary.

## Recursive Propagation: Splits All the Way Up

When an internal node splits and promotes a key to its parent, the parent might also be full! This triggers a **recursive cascade** of splits upward through the tree:

```mermaid
flowchart BT
    Leaf["🍃 Leaf overflows"]
    Int1["🗂️ Internal Node (Level 1)\\nreceives promoted key...\\nalso FULL!"]
    Int2["🗂️ Internal Node (Level 2)\\nreceives promoted key...\\nalso FULL!"]
    Root["🗂️ Root splits!\\nTree grows to depth 4"]

    Leaf -->|"promote key"| Int1
    Int1 -->|"promote key"| Int2
    Int2 -->|"promote key"| Root

    style Leaf fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#a7f3d0
    style Int1 fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#d8b4fe
    style Int2 fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#d8b4fe
    style Root fill:#7f1d1d,stroke:#f87171,stroke-width:2px,color:#fca5a5
```

This recursive behavior is what makes the B+Tree self-balancing — the tree grows uniformly from the root upward, guaranteeing that all leaf pages always remain at the same depth.

## Root Internal Node Split

When the root internal node itself overflows, the tree must grow one level deeper. The protocol mirrors the root leaf split from Stage 8:

1. **Allocate** a left internal child page and a right internal child page
2. **Copy** the lower half of keys and child pointers into the left child
3. **Copy** the upper half into the right child
4. **Extract** the median key
5. **Reinitialize** Page 0 as a fresh internal root with a single median key, left child pointer, and right_child pointer

After this operation, the tree depth increases by 1, and every existing leaf page remains untouched at the bottom of the hierarchy.

## Scaling Without Limits

With recursive internal node splitting, our B+Tree can now grow to any depth:

| Tree Depth | Max Internal Keys | Max Leaf Pages | Max Rows (8 per leaf) |
|:---:|:---:|:---:|:---:|
| 2 | 510 | 511 | ~4,088 |
| 3 | 510 × 511 | ~261,000 | ~2,088,000 |
| 4 | 510 × 511² | ~133M | ~1 billion |

With just 4 levels of internal nodes, our B+Tree can index over **1 billion rows** while maintaining O(log n) lookup performance. This is exactly how production databases like PostgreSQL and SQLite handle massive datasets with B+Tree indexes!
