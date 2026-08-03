# Stage 4: Row Serialization Test Plan

This document outlines the testing strategy for the Row Serialization stage (Stage 4) in all language implementations.

## Stage 4 Objectives
1. Convert a logical Row struct (id, name, email) into a compact, fixed-size **60-byte** buffer.
2. Convert the byte buffer back into a Row struct (deserialization).
3. Verify byte-level correctness via hex dump output.

## Row Layout

| Field | Type | Size (bytes) | Offset |
|-------|------|-------------|--------|
| id | int32 (little-endian) | 4 | 0 |
| name | char[28] (zero-padded) | 28 | 4 |
| email | char[28] (zero-padded) | 28 | 32 |
| **Total** | | **60** | |

## Debug Commands

### `serialize <insert_sql>`

Parses the INSERT SQL, builds a Row struct, serializes it to a 60-byte buffer, and prints the raw hex dump. **No disk I/O** — purely in-memory.

**Output format:**
```
[SERIALIZE] 01 00 00 00 64 61 6e 69 6d 61 72 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 64 61 6e 69 6d 61 72 40 65 6d 61 69 6c 2e 63 6f 6d 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
```

### `deserialize <hex_bytes>`

Parses the hex byte string, deserializes it into a Row struct, and prints the field values.

**Output format:**
```
[DESERIALIZE] Field id = 1
[DESERIALIZE] Field name = danimar
[DESERIALIZE] Field email = danimar@email.com
```

## Test Cases

All tests are in `tests/integration/python/stage4/serialization_tests.py` and run via `make test-stage4`.

The Python tests compute expected hex bytes programmatically using `struct.pack`, ensuring they validate the **actual serialization logic**, not hardcoded strings.

### Serialize Tests

#### 1. `serialize-valid-insert`
- **Header**: Serialize produces correct hex dump
- **Input**: `serialize insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');`
- **Must contain**: The full expected hex string computed by `build_expected_hex(1, 'danimar', 'danimar@email.com')`

#### 2. `serialize-zero-id`
- **Header**: Serialize handles id=0
- **Input**: `serialize insert into users (id, name, email) values (0, 'test', 'test@test.com');`
- **Must contain**: `[SERIALIZE] 00 00 00 00` (first 4 bytes are zero)

#### 3. `serialize-large-id`
- **Header**: Serialize handles large id (65535)
- **Input**: `serialize insert into users (id, name, email) values (65535, 'test', 'test@test.com');`
- **Must contain**: `[SERIALIZE] ff ff 00 00` (65535 in little-endian)

#### 4. `serialize-empty-strings`
- **Header**: Serialize handles empty strings
- **Input**: `serialize insert into users (id, name, email) values (1, '', '');`
- **Must contain**: Full expected hex (60 bytes, mostly zeros after id)

#### 5. `serialize-full-hex-match`
- **Header**: Serialize full hex matches expected bytes
- **Input**: `serialize insert into users (id, name, email) values (1, 'dan', 'dan@test.com');`
- **Must contain**: Complete 60-byte hex string validated byte-by-byte

#### 6. `serialize-syntax-error`
- **Header**: Serialize with invalid SQL returns error
- **Input**: `serialize insert into;`
- **Must contain**: `[ERROR:`

#### 7. `serialize-cli-mode`
- **Header**: Serialize works in -c CLI mode
- **CLI args**: `-c "serialize insert into users (id, name, email) values (1, 'test', 'test@test.com');"`
- **Must contain**: `[SERIALIZE]`

### Deserialize Tests

#### 8. `deserialize-valid`
- **Header**: Deserialize produces correct field values
- **Input**: `deserialize <hex for id=1, name=danimar, email=danimar@email.com>`
- **Must contain**: `[DESERIALIZE] Field id = 1`, `[DESERIALIZE] Field name = danimar`, `[DESERIALIZE] Field email = danimar@email.com`

#### 9. `deserialize-zero-id`
- **Header**: Deserialize handles id=0
- **Input**: `deserialize <hex for id=0, name=test, email=test@test.com>`
- **Must contain**: `[DESERIALIZE] Field id = 0`

#### 10. `deserialize-round-trip`
- **Header**: Serialize then deserialize produces matching fields
- **Input**: Two commands — serialize then deserialize with the same data
- **Must contain**: Both `[SERIALIZE]` and `[DESERIALIZE]` output with matching field values

## How to Run

```bash
make test-stage4          # all binaries
make test-c-stage4        # C only
make test-all-stages      # all stages, all binaries
```
