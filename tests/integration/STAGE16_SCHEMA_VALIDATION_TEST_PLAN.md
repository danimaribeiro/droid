# Stage 15: Schema Validation from Catalog

## Concept
Use the schema catalog to validate all DML operations (INSERT, SELECT, WHERE) at execution time. Instead of blindly accepting any column name or type, the executor checks the catalog and produces clear error messages.

## What It Teaches
- **Schema enforcement**: Real databases reject malformed queries before touching any data. The student implements this safety layer.
- **Error categories**: Different validation failures produce different error codes — table not found, column not found, type mismatch, column count mismatch. Each has a distinct error code for debuggability.
- **Catalog-driven execution**: The executor no longer hardcodes field offsets. It reads the catalog to know how many columns a table has, what their types are, and in what order they appear.
- **Defense in depth**: Validation happens at multiple layers — the parser catches syntax errors, the catalog validator catches semantic errors, and the executor catches runtime errors.

## Learning Objectives
1. Before INSERT, validate: table exists, column names match, value count matches, types match.
2. Before SELECT, validate: table exists, WHERE column exists.
3. Produce distinct error codes for each validation failure.
4. Ensure that valid operations still succeed without regression.
5. Handle edge cases: inserting a string where INT is expected, using an unknown column in WHERE.

## Error Codes Reference

| Error | Meaning |
|-------|---------|
| `[ERROR:01500]` | Table does not exist |
| `[ERROR:01501]` | Column not found in table |
| `[ERROR:01502]` | Column count mismatch |
| `[ERROR:01503]` | Type mismatch |

## How to Run
```bash
make test-c-stage15
```
