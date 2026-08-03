# Extra Stage: Views

## Concept
Implement virtual tables (views) that are defined by a SELECT query and can be queried like regular tables.

## What It Teaches
- **Query rewriting**: A view is not a physical table — it stores no data. When you `SELECT * FROM my_view`, the database replaces `my_view` with the view's definition query and executes the combined query. This is called query rewriting.
- **Abstraction layer**: Views hide complexity. A complex JOIN query can be wrapped in a view, and users query the view with a simple SELECT.
- **Catalog storage**: View definitions are stored in the schema catalog alongside table definitions, but marked as type=VIEW.
- **Updatable views (stretch)**: Simple views (single table, no aggregation) can support INSERT/UPDATE/DELETE that are translated to operations on the underlying table.

## Learning Objectives
1. Extend the parser to recognize `CREATE VIEW name AS SELECT ...`.
2. Store view definitions in the schema catalog (store the SQL text or the AST).
3. When a SELECT references a view name, replace it with the view's query during planning.
4. Ensure views compose: a view can reference another view.
5. Implement `DROP VIEW name;`.
6. Show views in `catalog list` with a `VIEW` marker.

## New SQL Syntax
```sql
CREATE VIEW active_users AS SELECT * FROM users WHERE id > 0;
SELECT * FROM active_users;
DROP VIEW active_users;
```

## Catalog Output
```
[CATALOG] Tables:
[CATALOG]   users (id INT, name VARCHAR, email VARCHAR) [TABLE]
[CATALOG]   active_users (SELECT * FROM users WHERE id > 0) [VIEW]
```
