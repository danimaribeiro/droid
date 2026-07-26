# Extra Stage: String & Built-in Functions

## Concept
Implement built-in SQL functions for string manipulation and common operations that can be used in SELECT columns and WHERE expressions.

## What It Teaches
- **Function call evaluation**: The expression evaluator must handle `UPPER(name)` as a function call node in the AST. The function takes one or more arguments, evaluates them, and returns a result.
- **Function registry**: A lookup table mapping function names to implementations. This is extensible — adding a new function means registering it, not changing the parser.
- **Type coercion**: `LENGTH(name)` takes a VARCHAR and returns an INT. The function must validate argument types and handle the return type correctly.
- **NULL propagation**: Most functions return NULL if any argument is NULL. `UPPER(NULL) = NULL`. This is called "strict" semantics.

## Functions to Implement

### String Functions
| Function | Description | Example |
|----------|-------------|---------|
| `UPPER(s)` | Uppercase | `UPPER('hello')` → `'HELLO'` |
| `LOWER(s)` | Lowercase | `LOWER('Hello')` → `'hello'` |
| `LENGTH(s)` | String length | `LENGTH('hello')` → `5` |
| `SUBSTR(s, start, len)` | Substring | `SUBSTR('hello', 2, 3)` → `'ell'` |
| `CONCAT(a, b)` | Concatenation | `CONCAT('a', 'b')` → `'ab'` |
| `TRIM(s)` | Remove whitespace | `TRIM('  hi  ')` → `'hi'` |
| `REPLACE(s, from, to)` | Replace substring | `REPLACE('hello', 'l', 'r')` → `'herro'` |

### Numeric Functions
| Function | Description | Example |
|----------|-------------|---------|
| `ABS(n)` | Absolute value | `ABS(-5)` → `5` |
| `MOD(a, b)` | Modulo | `MOD(10, 3)` → `1` |

### Utility Functions
| Function | Description | Example |
|----------|-------------|---------|
| `COALESCE(a, b, ...)` | First non-NULL | `COALESCE(NULL, 'default')` → `'default'` |
| `NULLIF(a, b)` | NULL if equal | `NULLIF(1, 1)` → `NULL` |

## Learning Objectives
1. Extend the parser to recognize function calls in SELECT and WHERE expressions.
2. Implement a function registry with name → implementation mapping.
3. Implement at least UPPER, LOWER, LENGTH, SUBSTR, CONCAT, COALESCE.
4. Handle NULL propagation correctly in strict functions.
5. Validate argument types and count.
6. Allow functions in WHERE: `SELECT * FROM users WHERE LENGTH(name) > 5`.

## New SQL Syntax
```sql
SELECT id, UPPER(name), LENGTH(email) FROM users;
SELECT * FROM users WHERE LENGTH(name) > 5;
SELECT COALESCE(name, 'unknown') FROM users;
SELECT CONCAT(name, ' <', email, '>') FROM users;
```
