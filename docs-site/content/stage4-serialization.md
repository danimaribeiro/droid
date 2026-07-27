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

## Why Serialize to Fixed Memory Buffers?

In memory during execution, a logical `Row` struct holds structured data with rich typed abstractions. However, when transitioning across storage boundaries—whether staging blocks inside an in-memory B-Tree node, writing recovery frames to a Write-Ahead Log (WAL), or flushing pages directly to disk—you must transform abstracted memory into a **flat, deterministic byte sequence**.

**Serialization** is the precise engineering protocol of packing field data into consecutive raw bytes at strict hardware offsets. **Deserialization** reverses this process, reading those hex bytes back into logical struct architectures without data degradation or memory corruption.

## Fixed-Size Row Memory Layout (60 Bytes)

In Part 1 of this database engine, every relational row in our users storage engine occupies exactly **60 bytes** of memory:

| Field | Storage Type | Size in Bytes | Offset | Hexadecimal Encoding Sample |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `int32` (Little-Endian) | **4 bytes** | `0` | `01 00 00 00` *(id = 1)* |
| **`name`** | `char[28]` (Zero-Padded) | **28 bytes** | `4` | `64 61 6e 69 ... 00 00` *("dani")* |
| **`email`** | `char[28]` (Zero-Padded) | **28 bytes** | `32` | `64 61 6e 69 40 ... 00` *("dani@")* |
| **TOTAL** | | **60 bytes** | | *(Contiguous memory allocation)* |

### Architectural Benefits of Fixed Formatting

By enforcing fixed 60-byte tuples with trailing `0x00` byte padding on character arrays, page layout mathematics become computationally straightforward:
1. **O(1) Direct Offset Addressing**: You never need to scan for character delimiters or variable termination markers to find field boundaries.
2. **Page Slot Predictability**: Exactly 68 tuples fit cleanly into a standard 4KB database memory page (`4096 / 60 ≈ 68.2`).
3. **Deterministic Hex Verification**: Because unused string buffer slots are cleanly zeroed out using `memset()`, two logical tuples with identical values will produce identically hashing binary signatures!

