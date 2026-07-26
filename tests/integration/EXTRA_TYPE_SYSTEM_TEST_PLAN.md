# Extra Stage: Extended Type System

## Concept
Expand the database beyond INT and VARCHAR to support a richer set of data types that cover real-world use cases.

## What It Teaches
- **Type representation**: Each type has a different in-memory representation, serialization format, comparison function, and display format. The student builds a type registry that encapsulates these behaviors.
- **Type-aware operations**: Comparison operators (`>`, `<`, `=`) must behave differently for each type. `'2' > '10'` is true for strings (lexicographic) but false for integers. This is a common source of bugs.
- **Date/time handling**: Dates are stored as integers (days since epoch) but displayed as `YYYY-MM-DD`. This teaches the difference between storage representation and display format.
- **Boolean logic**: TRUE, FALSE, and NULL. Three-valued logic — `NULL AND TRUE = NULL`, `NULL OR TRUE = TRUE`. This is one of the most subtle aspects of SQL.
- **DECIMAL precision**: Floating-point numbers lose precision (`0.1 + 0.2 ≠ 0.3`). Financial applications need exact decimal arithmetic. The student can implement fixed-point decimals.

## New Types

| Type | Storage | Size | Example |
|------|---------|------|---------|
| `BOOLEAN` | 1 byte (0/1/NULL) | 1 byte | `TRUE`, `FALSE` |
| `FLOAT` | IEEE 754 double | 8 bytes | `3.14`, `-0.001` |
| `DATE` | Days since epoch (int32) | 4 bytes | `'2025-07-26'` |
| `TIMESTAMP` | Microseconds since epoch (int64) | 8 bytes | `'2025-07-26 12:30:00'` |
| `TEXT` | Variable-length, no max | 2+ bytes | Long strings (no 252-char limit) |

## Learning Objectives
1. Implement a type registry that maps type names to serialization/comparison/display functions.
2. Implement BOOLEAN type with three-valued logic (TRUE, FALSE, NULL).
3. Implement FLOAT type with IEEE 754 storage and display formatting.
4. Implement DATE type with `YYYY-MM-DD` parsing and display.
5. Update the serializer to handle each type's binary representation.
6. Update comparison operators to be type-aware.
7. Implement type casting: `CAST(id AS VARCHAR)`, `CAST('2025-01-01' AS DATE)`.

## New SQL Syntax
```sql
CREATE TABLE events (
    id INT,
    name VARCHAR,
    start_date DATE,
    is_active BOOLEAN,
    price FLOAT
);
INSERT INTO events VALUES (1, 'Conference', '2025-07-26', TRUE, 99.99);
SELECT * FROM events WHERE start_date > '2025-01-01' AND is_active = TRUE;
```
