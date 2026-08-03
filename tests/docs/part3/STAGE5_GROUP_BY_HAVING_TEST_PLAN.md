# Stage 5: Group By & Having

## Stage Objective
Implement the `GROUP BY` clause and the `HAVING` filter using a Hash Aggregation approach.

## Conceptual Algorithms
- Extend the SQL Parser to recognize `GROUP BY <columns>` and `HAVING <condition>`.
- In the Query Planner, introduce a `HashAggregationNode` that sits above the data scan.
- The HashAggregationNode will use an in-memory Hash Table to group rows.
- The hashing key is the concatenated bytes of the grouped columns.
- For each row from the child node, probe the hash table. If the group exists, update the running aggregates. If it doesn't, insert a new entry.
- Once the child node is fully consumed, the `HashAggregationNode` begins yielding the grouped rows, applying the `HAVING` condition before yielding.

## Implementation Checklist
- [ ] Add `GROUP BY` and `HAVING` tokens to Lexer.
- [ ] Parse `GROUP BY` and `HAVING` into the AST.
- [ ] Update `explain` to show `HashAggregationNode`.
- [ ] Implement a generic Hash Table structure for memory.
- [ ] Implement HashAggregation execution logic.
- [ ] Verify execution outputs correctly grouped data.

## Expected Contract
When a `GROUP BY` statement is executed, the engine should group results and apply aggregates per group, and filter groups using `HAVING`.
