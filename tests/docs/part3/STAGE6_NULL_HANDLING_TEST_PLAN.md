# Stage 6: Null Handling

## Stage Objective
Add support for `NULL` values, nullable column definitions, and `IS NULL` / `IS NOT NULL` conditions.

## Conceptual Algorithms
- Extend the `CREATE TABLE` parser to accept `NULL` or `NOT NULL` constraints (defaulting to nullable).
- Modify the serialization format. Since we have fixed-size and varlen pages, `NULL` can be represented using a null-bitmap at the start of the row header. 1 bit per column.
- Update the SQL Lexer/Parser to recognize `NULL` as a value literal.
- Add support for `IS NULL` and `IS NOT NULL` in the `WHERE` clause parser and executor logic.
- Ensure aggregate functions ignore `NULL` values correctly (except `COUNT(*)`).

## Implementation Checklist
- [ ] Add `NULL`, `IS`, `NOT` tokens.
- [ ] Support `IS NULL` and `IS NOT NULL` in the AST.
- [ ] Implement a null-bitmap in the tuple serialization layer.
- [ ] Update `insert` logic to handle null constraints.
- [ ] Update filter logic in Sequential/Index Scans.

## Expected Contract
When inserting a row missing nullable columns, it should be stored as NULL. `SELECT ... WHERE col IS NULL` should return the correct rows. `NOT NULL` constraints should raise an error when violated.
