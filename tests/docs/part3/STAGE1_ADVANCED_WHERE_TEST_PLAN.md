# Stage 20: Advanced WHERE Expressions

## Concept
Extend the WHERE clause evaluation from simple `column = value` to support comparison operators, logical connectives, and pattern matching.

## What It Teaches
- **Expression trees**: Representing `WHERE a > 5 AND name LIKE 'dan%'` as a tree of operator nodes that can be recursively evaluated.
- **Type-aware comparison**: Comparing INT values numerically and VARCHAR values lexicographically.
- **Short-circuit evaluation**: `AND` stops evaluating if the left side is false; `OR` stops if the left side is true.
- **Pattern matching**: Implementing `LIKE` with `%` (any sequence) and `_` (single character) wildcards.

## Learning Objectives
1. Extend the parser to recognize `>`, `<`, `>=`, `<=`, `!=`, `AND`, `OR`, `LIKE`, `IS NULL`, `IS NOT NULL`.
2. Build an expression AST node that supports binary operators and unary operators.
3. Implement `evaluate_expression(row, expr) → bool` that recursively evaluates the expression tree against a row.
4. Integrate expression evaluation into the SeqScan and IndexScan filter logic.
5. Support `IS NULL` for detecting empty/missing values.

## New SQL Syntax
```sql
SELECT * FROM users WHERE id > 5;
SELECT * FROM users WHERE id >= 1 AND id <= 10;
SELECT * FROM users WHERE name LIKE 'dan%';
SELECT * FROM users WHERE email IS NOT NULL;
SELECT * FROM users WHERE id > 3 OR name = 'alice';
```
