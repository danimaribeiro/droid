# Stage 14: CREATE TABLE & Schema Catalog

## Concept
Replace the hardcoded "users" table with a dynamic schema system. The student implements `CREATE TABLE` and stores table definitions in a schema catalog — a special system table that persists across sessions.

## What It Teaches
- **DDL vs DML**: `CREATE TABLE` is a Data Definition Language command — it changes the database structure, not the data. The student's parser now handles two fundamentally different command types.
- **System catalog**: Every real database has internal tables that describe the schema. PostgreSQL has `pg_class`, `pg_attribute`. SQLite has `sqlite_master`. The student builds their own.
- **Catalog storage**: The catalog is stored in a reserved B-tree (page 0 or a special system page). On startup, the database reads the catalog to know which tables exist.
- **Schema persistence**: Table definitions must survive across sessions, just like data. The catalog is stored using the same pager/B-tree infrastructure.

## Learning Objectives
1. Extend the parser to recognize `CREATE TABLE name (col1 type1, col2 type2, ...)`.
2. Define a catalog entry format: `[table_name][column_count][columns...]`.
3. Store catalog entries in a dedicated B-tree (system table).
4. On startup, read the catalog to populate an in-memory table registry.
5. Implement the `catalog list` debug command.
6. Reject duplicate table creation with an error.
7. Verify that INSERT and SELECT still work after CREATE TABLE.

## New SQL Syntax
```sql
CREATE TABLE users (id INT, name VARCHAR, email VARCHAR);
CREATE TABLE products (id INT, title VARCHAR, price INT);
```

## Debug Command: `catalog list`

```
[CATALOG] Tables:
[CATALOG]   users (id INT, name VARCHAR, email VARCHAR)
[CATALOG]   products (id INT, title VARCHAR, price INT)
```

## How to Run
```bash
make test-c-stage14
```
