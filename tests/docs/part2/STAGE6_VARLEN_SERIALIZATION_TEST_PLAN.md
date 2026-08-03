# Stage 11: Variable-Length Row Serialization

## Concept
Replace the fixed 60-byte row format with a compact variable-length format where each field stores only the bytes it needs, using length prefixes for string fields.

## What It Teaches
- **Length-prefixed encoding**: Each VARCHAR field is preceded by a 2-byte length, so the deserializer knows exactly how many bytes to read. This is how real databases (PostgreSQL TOAST, MySQL InnoDB) store variable-length data.
- **Space efficiency**: A row with name="dan" (3 chars) uses 18 bytes instead of 60 — a dramatic size reduction. This means more rows per page, fewer disk reads, and better cache utilization.
- **Offset calculation**: With fixed fields, `email` is always at byte 256. With variable fields, `email` offset depends on the actual length of `name`. The student learns to compute field offsets dynamically.
- **Round-trip correctness**: Serialize → write to buffer → deserialize must produce identical values. This is the fundamental invariant of any serialization format.

## Format

```
[row_size:4][id:4][name_len:2][name:N][email_len:2][email:M]
```

Where `row_size = 4 + 4 + 2 + N + 2 + M = 12 + N + M`

## Learning Objectives
1. Implement `serialize_row()` that writes a compact variable-length buffer.
2. Implement `deserialize_row()` that reads length prefixes to reconstruct field values.
3. Compute and display byte offsets for each field dynamically.
4. Ensure round-trip correctness for edge cases: empty strings, maximum-length strings, zero id.
5. Update the `serialize` debug command to show the new format with `(variable)` tag.

## Debug Command: `serialize <insert_sql>`

```
[SERIALIZE] Row Size: 18 bytes (variable)
[SERIALIZE] Layout: [row_size:4@0][id:4@4][name_len:2@8][name:3@10][email_len:2@13][email:3@15]
[SERIALIZE] Field id = 1
[SERIALIZE] Field name = "dan" (3 bytes)
[SERIALIZE] Field email = "d@e" (3 bytes)
[SERIALIZE] Round-trip: OK
```

## How to Run
```bash
make test-c-stage11
```
