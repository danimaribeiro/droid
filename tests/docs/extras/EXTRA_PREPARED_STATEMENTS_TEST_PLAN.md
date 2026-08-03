# Extra Stage: Prepared Statements

## Concept
Implement prepared (parameterized) statements that parse a query once and execute it multiple times with different parameter values.

## What It Teaches
- **Parse once, execute many**: Parsing SQL is expensive. A prepared statement parses the SQL into an AST once, then accepts parameter values on each execution. This is how connection pools and ORMs achieve high performance.
- **Parameter binding**: The SQL contains placeholders (`$1`, `$2` or `?`) instead of literal values. On execute, the caller provides actual values that replace the placeholders.
- **SQL injection prevention**: Because parameters are bound after parsing, they cannot change the query's structure. `$1 = "'; DROP TABLE users; --"` is treated as a string value, not as SQL. This is the primary defense against SQL injection.
- **Query plan caching**: The planner can also cache the execution plan for a prepared statement, avoiding replanning on each execution.

## Learning Objectives
1. Extend the parser to recognize `PREPARE name AS SELECT ... WHERE id = $1`.
2. Store the parsed AST in an in-memory prepared statement cache.
3. Implement `EXECUTE name (value1, value2, ...)` that binds parameters and runs.
4. Implement `DEALLOCATE name` to remove a prepared statement.
5. Verify that parameters are type-checked against the catalog schema.

## New SQL Syntax
```sql
PREPARE find_user AS SELECT * FROM users WHERE id = $1;
EXECUTE find_user (42);
EXECUTE find_user (7);
DEALLOCATE find_user;
```
