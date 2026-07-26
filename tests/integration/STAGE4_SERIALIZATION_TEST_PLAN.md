# Stage 4: Row Serialization Test Plan

This document outlines the testing strategy for the Row Serialization stage (Stage 4) in all language implementations.

## Stage 4 Objectives
1. Convert a logical Row struct (id, name, email) into a compact, fixed-size byte buffer.
2. Convert the byte buffer back into a Row struct (deserialization).
3. Verify that the round-trip produces identical data.

## Debug Command: `serialize <insert_sql>`

Parses the INSERT SQL, builds a Row struct, serializes it to bytes, deserializes it back, and prints a structured report. **No disk I/O** — purely in-memory.

### Output Format Contract

```
[SERIALIZE] Row Size: 508 bytes
[SERIALIZE] Layout: [id:4B@0][name:252B@4][email:252B@256]
[SERIALIZE] Field id = 1 (hex: 01 00 00 00)
[SERIALIZE] Field name = "danimar" (252 bytes, zero-padded)
[SERIALIZE] Field email = "danimar@email.com" (252 bytes, zero-padded)
[SERIALIZE] Round-trip: OK
```

On round-trip failure: `[SERIALIZE] Round-trip: FAIL (field 'name' mismatch)`

## Test Cases

All tests are in `tests/integration/python/stage4/serialization_tests.py` and run via `make test-stage4`.

### 1. `serialize-valid-insert`
- **Input**: `serialize insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');`
- **Expected**: Output contains `[SERIALIZE] Row Size: 508` and `[SERIALIZE] Round-trip: OK`

### 2. `serialize-fields-present`
- **Input**: Same as above
- **Expected**: Output contains `[SERIALIZE] Field id = 1`, `[SERIALIZE] Field name =` with `danimar`, `[SERIALIZE] Field email =` with `danimar@email.com`

### 3. `serialize-zero-id`
- **Input**: values `(0, 'test', 'test@test.com')`
- **Expected**: `[SERIALIZE] Field id = 0` and `Round-trip: OK`

### 4. `serialize-large-id`
- **Input**: values `(65535, 'test', 'test@test.com')`
- **Expected**: `[SERIALIZE] Field id = 65535` and `Round-trip: OK`

### 5. `serialize-empty-strings`
- **Input**: values `(1, '', '')`
- **Expected**: `Round-trip: OK` and `Row Size: 508` (fixed size regardless of content)

### 6. `serialize-layout-offsets`
- **Input**: values `(1, 'a', 'b')`
- **Expected**: Output contains `[SERIALIZE] Layout:` line showing byte offsets

### 7. `serialize-syntax-error`
- **Input**: `serialize insert into;`
- **Expected**: Error code `[ERROR:` present in output

### 8. `serialize-cli-mode`
- **Input**: `-c "serialize insert into users (id, name, email) values (1, 'test', 'test@test.com');"`
- **Expected**: `[SERIALIZE]` and `Round-trip: OK` in output

## Row Layout Reference

| Field | Type    | Size (bytes) | Offset |
|-------|---------|-------------|--------|
| id    | int32   | 4           | 0      |
| name  | char[]  | 252         | 4      |
| email | char[]  | 252         | 256    |
| **Total** |     | **508**     |        |

## How to Run

```bash
make test-stage4          # all binaries
make test-c-stage4        # C only
make test-all-stages      # all stages, all binaries
```
