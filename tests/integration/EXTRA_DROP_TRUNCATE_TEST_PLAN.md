# Extra Stage: DROP TABLE & TRUNCATE

## Concept
Implement commands to remove table definitions and quickly clear table data.

## What It Teaches
- **DROP TABLE**: Removes the table from the catalog AND deallocates all its data pages. This is a destructive DDL operation. The student must handle foreign key dependencies (can't drop a table that's referenced by another table's foreign key).
- **TRUNCATE**: Removes all rows from a table but keeps the table definition. Much faster than `DELETE FROM table` because it doesn't need to log individual row deletions — it simply deallocates all data pages and resets the root page.
- **Cascade behavior**: `DROP TABLE users CASCADE` also drops dependent objects (foreign keys, views, indexes). Without CASCADE, it fails if dependencies exist.
- **Page deallocation**: The pager marks freed pages as available for reuse. This teaches the concept of a free page list.

## Learning Objectives
1. Implement `DROP TABLE name;` that removes the catalog entry and frees data pages.
2. Implement `DROP TABLE name CASCADE;` that removes dependent objects first.
3. Implement `TRUNCATE TABLE name;` that clears data but preserves the table definition.
4. Handle errors: dropping a non-existent table, dropping with dependencies.
5. Implement `IF EXISTS` variant: `DROP TABLE IF EXISTS name;` (no error if missing).
6. Update the free page list when pages are deallocated.

## New SQL Syntax
```sql
DROP TABLE users;
DROP TABLE IF EXISTS users;
DROP TABLE users CASCADE;
TRUNCATE TABLE users;
```
