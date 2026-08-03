# Extra Stage: DISTINCT & Set Operations

## Concept
Implement result deduplication with SELECT DISTINCT and set operations (UNION, INTERSECT, EXCEPT) that combine results from multiple queries.

## What It Teaches
- **DISTINCT**: Removes duplicate rows from the result set. Implementation uses either sorting (sort then skip consecutive duplicates) or hashing (insert into hash set, skip if already seen).
- **UNION**: Combines results from two SELECTs, removing duplicates. `UNION ALL` keeps duplicates.
- **INTERSECT**: Returns only rows that appear in BOTH result sets.
- **EXCEPT**: Returns rows from the first result set that do NOT appear in the second.
- **Type compatibility**: Both sides of a set operation must have the same number of columns with compatible types. The student validates this during planning.

## Learning Objectives
1. Implement `SELECT DISTINCT` using hash-based deduplication.
2. Implement `UNION` and `UNION ALL` as a new PlanNode that concatenates two child results.
3. Implement `INTERSECT` using hash set intersection.
4. Implement `EXCEPT` using hash set difference.
5. Validate column count and type compatibility between operands.

## New SQL Syntax
```sql
SELECT DISTINCT name FROM users;
SELECT id FROM users UNION SELECT id FROM orders;
SELECT id FROM users INTERSECT SELECT user_id FROM orders;
SELECT id FROM users EXCEPT SELECT user_id FROM orders;
```
