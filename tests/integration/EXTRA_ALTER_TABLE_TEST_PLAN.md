# Extra Stage: ALTER TABLE

## Concept
Implement schema evolution — modifying a table's structure after it has been created and populated with data.

## What It Teaches
- **Schema migration**: In production, tables evolve over time. Adding a column, renaming a field, or changing a type must happen without losing existing data. This is one of the hardest problems in database engineering.
- **ADD COLUMN**: The simplest operation. New rows get the new column. Existing rows can either be rewritten (expensive) or use a default value for the missing column (lazy migration).
- **DROP COLUMN**: Mark the column as dropped in the catalog. Existing rows still contain the old data on disk but it's ignored during deserialization. Reclaimed during VACUUM.
- **RENAME COLUMN**: Only changes the catalog metadata — no data on disk needs to change.
- **Online vs offline migration**: An offline ALTER locks the table and rewrites all pages. An online ALTER modifies only the catalog and handles old-format rows lazily during reads. The student learns why PostgreSQL's `ADD COLUMN ... DEFAULT` is instant.
- **Versioned row format**: Each row can carry a schema version number. The deserializer checks the version and applies migrations on-the-fly.

## Learning Objectives
1. Implement `ALTER TABLE t ADD COLUMN name type [DEFAULT value]`.
2. Implement `ALTER TABLE t DROP COLUMN name`.
3. Implement `ALTER TABLE t RENAME COLUMN old TO new`.
4. Update the catalog on ALTER without rewriting data pages.
5. Handle deserialization of old-format rows that are missing the new column (use default value).
6. Verify that SELECT returns the new column with defaults for old rows.

## New SQL Syntax
```sql
ALTER TABLE users ADD COLUMN age INT DEFAULT 0;
ALTER TABLE users DROP COLUMN email;
ALTER TABLE users RENAME COLUMN name TO full_name;
```
