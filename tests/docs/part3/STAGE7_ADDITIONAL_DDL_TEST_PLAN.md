# Stage 7: Additional DDL

## Stage Objective
Implement schema modification capabilities through `ALTER TABLE` and `DROP TABLE`.

## Conceptual Algorithms
- `DROP TABLE`: Locate the table in the catalog schema, delete the B-Tree root page, mark all associated pages as free in the free-list (so they can be reused), and remove the catalog entry.
- `ALTER TABLE`: Implement adding new columns. For schema versioning, existing rows won't be physically rewritten immediately. Instead, the schema catalog records the default value for the new column, and the read path will pad rows that are missing the column.

## Implementation Checklist
- [ ] Add `DROP`, `ALTER`, `ADD`, `COLUMN` tokens to Lexer.
- [ ] Parse `DROP TABLE` and `ALTER TABLE ADD COLUMN` commands.
- [ ] Update the catalog storage to remove table references for DROP.
- [ ] Implement page deallocation (adding pages to the free-list).
- [ ] Update the schema catalog to support schema versioning / adding columns.
- [ ] Ensure `SELECT` reads old tuples properly with default padding for new columns.

## Expected Contract
When `DROP TABLE users;` is executed, subsequent queries on `users` should fail with "Table not found", and disk space should be marked as reusable. When `ALTER TABLE users ADD COLUMN age INT;` is executed, existing rows will return NULL (or a default) for `age`.
