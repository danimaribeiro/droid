---
stage: 12
title: "DELETE & UPDATE Execution"
subtitle: "Implementing row modification and removal in a fixed-layout B+Tree"
section: "Complete SQL"
objective: "Implement the DELETE and UPDATE SQL statements by navigating the B+Tree to the target row, shifting elements to remove records, or mutating the payload in-place."
concepts:
  - "Extending the Query Planner to support DeleteNode and UpdateNode."
  - "Removing cells from a B+Tree leaf node and using memmove to shift the remaining cells left, closing the gap."
  - "Updating the payload (name, email) of a fixed-size row directly in memory."
  - "Updating the root cell count when a deletion occurs."
algorithms:
  - title: "DELETE Execution"
    description: "To delete a row, the engine must find its exact position in the B-Tree leaf and remove it."
    steps:
      - "The Volcano Executor receives a DeleteNode with the target id."
      - "Call btree_find(id) to obtain a cursor pointing to the exact leaf page and cell_num."
      - "If the key is not found, return a \"Row not found\" error."
      - "Calculate the byte offset of the cell to delete."
      - "Use memmove to shift all cells from (cell_num + 1) to (num_cells - 1) left by one cell width (ROW_SIZE + 4)."
      - "Decrement num_cells in the leaf node header."
      - "Flush the modified page to disk."
  - title: "UPDATE Execution"
    description: "To update a row's data without changing its primary key, the engine modifies the payload in-place."
    steps:
      - "The Volcano Executor receives an UpdateNode with the target id and the new values."
      - "Call btree_find(id) to obtain a cursor to the target cell."
      - "Deserialize the current row from the cell."
      - "Overwrite the requested fields (e.g., name or email) with the new values."
      - "Serialize the row back into the exact same memory location on the leaf page."
      - "Flush the modified page to disk."
checklist:
  - "Add parsing support for DELETE FROM table WHERE id = N"
  - "Add parsing support for UPDATE table SET col = val WHERE id = N"
  - "Add DeleteNode and UpdateNode to the Volcano execution plan"
  - "Implement execute_delete() with memmove shifting"
  - "Implement execute_update() with in-place serialization"
  - "Verify that btree structure shows the correct reduced cell count after a deletion"
  - "Verify that a SELECT after a DELETE skips the removed row"
---

## Completing the CRUD Cycle

So far, our database supports **C**reate (INSERT) and **R**ead (SELECT). In this stage, we will implement the final pieces of the puzzle: **U**pdate and **D**elete.

Because we are doing this *before* introducing variable-length strings and slotted pages (which happen in Part 2), our implementation will be surprisingly simple! Since every row in our database currently takes exactly 508 bytes, and each cell (key + row) takes exactly 512 bytes, we can manipulate them like a standard array in memory.

## DELETE: Shifting Cells

When a user executes `DELETE FROM users WHERE id = 3`, the engine performs the following steps:

1. **Find**: Use our existing `btree_find(3)` function to locate the exact leaf page and cell index.
2. **Shift**: Remove the cell by sliding all subsequent cells to the left.
3. **Decrement**: Update the `num_cells` counter in the leaf page header.

```mermaid
flowchart LR
    subgraph Before["Before DELETE"]
        direction LR
        A1["[id=1]"]
        A2["[id=3] ❌"]
        A3["[id=5]"]
        A4["[id=7]"]
        A1 ~~~ A2 ~~~ A3 ~~~ A4
    end

    subgraph After["After DELETE (memmove)"]
        direction LR
        B1["[id=1]"]
        B3["[id=5] ⬅️"]
        B4["[id=7] ⬅️"]
        B_Empty["(empty)"]
        B1 ~~~ B3 ~~~ B4 ~~~ B_Empty
    end

    Before ==> After
```

In C, this left-shift is accomplished efficiently using `memmove`, which safely copies overlapping memory regions.

> [!NOTE]
> **What about B-Tree Underflow?** 
> In a complete B-Tree implementation, if a node's occupancy drops below 50% after a deletion, it should be merged with a sibling node (Underflow). However, in many real-world databases (like PostgreSQL), nodes are rarely merged immediately because doing so is computationally expensive and locks large portions of the tree. Instead, they rely on background processes (like `VACUUM`) to reclaim space later. To keep things simple, we will skip node merging for now.

## UPDATE: In-Place Mutation

When a user executes `UPDATE users SET name = 'bob' WHERE id = 3`, the process is even simpler. Because our rows are fixed-size, the new data is guaranteed to fit in the exact same slot as the old data.

1. **Find**: Locate the cell using `btree_find(3)`.
2. **Deserialize**: Read the existing row data into memory.
3. **Modify**: Change the `name` field.
4. **Serialize**: Write the modified row back to the exact same byte offset in the leaf page.

By executing this in-place, the B-Tree structure is completely unaffected. No cells need to shift, and no nodes need to split!

## The Volcano Integration

Remember the Volcano Model we implemented in Stage 11? `DELETE` and `UPDATE` fit perfectly into this architecture. The Query Planner simply generates a `DeleteNode` or `UpdateNode` instead of an `IndexScan` or `SeqScan`. 

When the executor loop runs `plan->next()`, these modification nodes will locate the target row, perform the mutation, and return the modified row (or a success indicator) to the user.
