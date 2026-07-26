# Stage 29: Foreign Keys & Constraints

## Concept
Implement referential integrity constraints so the database prevents orphaned records — e.g., an order referencing a user that doesn't exist.

## What It Teaches
- **Referential integrity**: A foreign key guarantees that every value in a column exists as a primary key in another table. This is the foundation of relational data modeling.
- **Constraint enforcement on INSERT**: Before inserting an order with `user_id = 5`, the database must verify that a user with `id = 5` exists. If not, the INSERT is rejected.
- **Constraint enforcement on DELETE**: Deleting a user that has orders must either fail (RESTRICT), delete the orders too (CASCADE), or set the foreign key to NULL (SET NULL).
- **CASCADE behavior**: `ON DELETE CASCADE` automatically deletes dependent rows. This teaches the student about recursive operations that span multiple tables.
- **Performance cost**: Every INSERT with a foreign key requires a lookup in the referenced table. The student sees why indexes on foreign key columns matter.

## Learning Objectives
1. Extend CREATE TABLE syntax to support `REFERENCES` clause.
2. Store foreign key metadata in the schema catalog.
3. On INSERT, validate that referenced values exist in the parent table.
4. On DELETE, enforce the constraint action (RESTRICT, CASCADE, SET NULL).
5. Produce clear error messages for constraint violations.

## New SQL Syntax
```sql
CREATE TABLE orders (
    id INT,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    total INT
);
```
