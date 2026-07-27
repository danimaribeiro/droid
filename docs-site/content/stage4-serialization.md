---
stage: 4
title: "Compact Row Memory Packing"
subtitle: "Serializing memory data to compact binary blobs"
section: "Data Row Serialization"
objective: "Map logical rows (id, name, email) to a fixed 60-byte binary buffer and back, ensuring zero data loss through a serialize/deserialize round-trip."
concepts:
  - "Fixed-size binary serialization (struct to bytes)"
  - "Memory layout: offsets, padding, and field alignment"
  - "Round-trip verification: serialize then deserialize must produce identical data"
  - "Hex dump representation for inspecting raw bytes"
algorithms:
  - title: "Row Serialization (Row → Buffer)"
    description: "Convert an in-memory Row struct into a compact, fixed-size byte buffer that can be stored on disk or in a B-tree page."
    steps:
      - "Allocate a buffer of ROW_SIZE (60) bytes, initialized to zero."
      - "Copy the 'id' field (4 bytes, int32) into the buffer at offset 0 using memcpy."
      - "Copy the 'name' field (28 bytes, char[28]) into the buffer at offset 4. The field is zero-padded — any unused bytes remain as 0x00."
      - "Copy the 'email' field (28 bytes, char[28]) into the buffer at offset 32. Same zero-padding applies."
      - "The resulting buffer is exactly 60 bytes regardless of actual string lengths."
  - title: "Row Deserialization (Buffer → Row)"
    description: "Reconstruct a Row struct from a raw byte buffer by reading fields at their known offsets."
    steps:
      - "Allocate a Row struct, initialized to zero."
      - "Read 4 bytes from buffer offset 0 into the 'id' field using memcpy."
      - "Read 28 bytes from buffer offset 4 into the 'name' field."
      - "Read 28 bytes from buffer offset 32 into the 'email' field."
      - "The fields are now populated. Because strings are zero-padded, standard string functions (strlen, strcmp) work correctly on them."
  - title: "Hex Dump Interpretation"
    description: "Reading the raw hex output tells you exactly what bytes are at each offset, making it possible to verify the serialization is correct."
    steps:
      - "Bytes 0-3: The 'id' field in little-endian. For id=1: '01 00 00 00'. For id=65535: 'ff ff 00 00'."
      - "Bytes 4-31: The 'name' field. ASCII characters followed by zero padding. For 'dan': '64 61 6e 00 00 ...'."
      - "Bytes 32-59: The 'email' field. Same encoding. For 'dan@test.com': '64 61 6e 40 74 65 73 74 2e 63 6f 6d 00 ...'."
      - "If any byte is wrong, the round-trip test will fail — meaning the offsets or sizes in your serialize/deserialize functions don't match."
checklist:
  - "Define ROW_SIZE (60), field sizes (4, 28, 28), and offsets (0, 4, 32) as constants"
  - "Implement serialize_row(Row *row, char *buf) using memcpy at fixed offsets"
  - "Implement deserialize_row(char *buf, Row *row) using memcpy at fixed offsets"
  - "Implement the 'serialize' debug command: parse INSERT → build Row → serialize → print hex dump"
  - "Implement the 'deserialize' debug command: parse hex input → deserialize → print field values"
  - "Verify round-trip: serialize then deserialize produces identical field values"
---

## Why Serialize?

In memory, a Row struct has a nice structure with named fields. But to write data to disk or store it in a B-tree page, you need a **flat byte sequence** — a contiguous block of bytes with a known layout.

**Serialization** is the process of converting structured data into bytes. **Deserialization** is the reverse.

## The Row Layout

Every row in the database is exactly **60 bytes**:

| Field | Type | Size | Offset | Example Hex |
|-------|------|------|--------|-------------|
| id | int32 (LE) | 4 bytes | 0 | `01 00 00 00` |
| name | char[28] | 28 bytes | 4 | `64 61 6e 00 ...` |
| email | char[28] | 28 bytes | 32 | `64 61 6e 40 ...` |
| **Total** | | **60 bytes** | | |

The fixed size means every row takes the same space — which makes B-tree storage and page layout much simpler (you always know exactly how many rows fit in a page).

## Debug Commands

**Serialize** — Parses an INSERT, serializes the row, and prints the raw hex bytes:

```
droid > serialize insert into users (id, name, email) values (1, 'dan', 'dan@test.com');
[SERIALIZE] 01 00 00 00 64 61 6e 00 00 00 ... 64 61 6e 40 74 65 73 74 2e 63 6f 6d 00 ...
```

**Deserialize** — Takes hex bytes and reconstructs the row fields:

```
droid > deserialize 01 00 00 00 64 61 6e 00 ... 00
[DESERIALIZE] Field id = 1
[DESERIALIZE] Field name = dan
[DESERIALIZE] Field email = dan@test.com
```
