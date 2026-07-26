# Database Internals Tutorial — Full Stage & Test Plan

## Overview

10 stages, each teaching one concept, each tested independently via CLI debug commands. Stages 1–3 are done. This plan covers Stages 4–10.

**Guiding principle**: Each stage has a debug command that exposes the internal state of the component being built. The student codes until the tests pass. Previous-stage tests keep passing.

```mermaid
graph LR
    S1["1 REPL ✅"] --> S2["2 Lexer ✅"]
    S2 --> S3["3 Parser ✅"]
    S3 --> S4["4 Row Serialization"]
    S4 --> S5["5 Pager"]
    S5 --> S6["6 B-Tree Leaf & INSERT"]
    S6 --> S7["7 B-Tree Search & SELECT"]
    S7 --> S8["8 B-Tree Splits"]
    S8 --> S9["9 Persistence & WHERE"]
    S9 --> S10["10 WAL (future)"]
```

---

## Debug Command Summary

Every stage adds a new CLI debug command. These compound — all previous commands keep working.

| Stage | Command | Purpose |
|-------|---------|---------|
| 2 | `tokenize <sql>` | Dump lexer tokens |
| 3 | `ast <sql>` | Dump parsed AST |
| 4 | `serialize <insert_sql>` | Show row byte layout + round-trip |
| 5 | `pager status` | Show page/cache state |
| 5 | `pager alloc` | Allocate a new empty page |
| 6 | `btree dump [page]` | Dump B-tree node structure |
| 7 | `btree find <key>` | Search for a key and show row |
| 8 | `btree structure` | Show full tree topology |

Stages 9–10 use real SQL execution (INSERT + SELECT) — no special debug commands needed.

---

## Stage 4: Row Serialization

### What the student learns
How to convert a logical struct (id, name, email) into a flat byte buffer and back. Memory layout, offsets, fixed-width fields.

### What the student implements
- `serialize_row(Row *row, char *buf)` — packs struct into bytes
- `deserialize_row(char *buf, Row *row)` — unpacks bytes into struct
- The `serialize` debug command in the engine/REPL

### Debug command: `serialize <insert_sql>`

The command parses the INSERT SQL (reusing the Stage 3 parser), builds a Row struct from the values, serializes it to a byte buffer, deserializes it back, and prints a structured report. **No disk I/O** — this is purely in-memory.

### Output format contract

```
[SERIALIZE] Row Size: 508 bytes
[SERIALIZE] Layout: [id:4B@0][name:252B@4][email:252B@256]
[SERIALIZE] Field id = 1 (hex: 01 00 00 00)
[SERIALIZE] Field name = "danimar" (252 bytes, zero-padded)
[SERIALIZE] Field email = "danimar@email.com" (252 bytes, zero-padded)
[SERIALIZE] Round-trip: OK
```

On round-trip failure (deserialized values don't match originals):
```
[SERIALIZE] Round-trip: FAIL (field 'name' mismatch)
```

### Test cases

| # | Case | CLI Input | Mode | Key assertions |
|---|------|-----------|------|----------------|
| 1 | `serialize-valid` | `serialize insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');` | match | Output contains `Row Size: 508`, all 3 field lines present, `Round-trip: OK` |
| 2 | `serialize-round-trip-ok` | Same as above | match | `Round-trip: OK` present |
| 3 | `serialize-id-hex-le` | `serialize insert into users (id, name, email) values (1, 'a', 'b');` | match | Field id line contains `01 00 00 00` (little-endian) |
| 4 | `serialize-zero-id` | values `(0, 'test', 'test@test.com')` | match | Field id hex: `00 00 00 00` |
| 5 | `serialize-large-id` | values `(65535, 'x', 'y')` | match | Field id hex: `ff ff 00 00` |
| 6 | `serialize-empty-strings` | values `(1, '', '')` | match | Field name = `""`, Field email = `""`, Round-trip: OK |
| 7 | `serialize-syntax-error` | `serialize insert into;` | error | Error code present (parser error) |

> [!NOTE]
> The `[SERIALIZE]` prefix makes output machine-parseable and visually distinct. Tests use substring/regex matching on each line.

---

## Stage 5: The Pager & Buffer Pool

### What the student learns
Pages as the unit of disk I/O. A 4KB page is the smallest thing you read/write from disk. The pager manages an in-memory cache of pages.

### What the student implements
- `pager_get_page(pager, page_num)` — returns a page from cache or loads from disk
- `pager_flush(pager, page_num)` — writes a cached page to disk
- Page allocation (extending the file)
- The `pager` debug commands in the engine/REPL

### Debug commands

| Command | Behavior |
|---------|----------|
| `pager status` | Print total pages, cached page count |
| `pager alloc` | Allocate a new zeroed page, print its number |
| `pager get <N>` | Load page N into cache, report hit/miss |

### Output format contract

```
[PAGER] Status: total_pages=0 cached=0
```
```
[PAGER] Alloc: page 0 (4096 bytes, zeroed)
```
```
[PAGER] Get page 0: CACHE_HIT
```
```
[PAGER] Get page 5: CACHE_MISS (loaded from disk)
```
```
[PAGER] Get page 999: ERROR (page out of bounds)
```

### Test cases

All pager tests run within a single session (no cross-session yet — that's Stage 9).

| # | Case | Input Sequence | Key assertions |
|---|------|----------------|----------------|
| 1 | `pager-status-fresh` | `pager status` | Output contains `total_pages=0` or `total_pages=1` depending on auto-init |
| 2 | `pager-alloc` | `pager alloc` | Output contains `Alloc: page` and a page number |
| 3 | `pager-alloc-increments` | `pager alloc` × 2, then `pager status` | total_pages increased by 2 |
| 4 | `pager-get-after-alloc` | `pager alloc`, then `pager get 0` | Shows `CACHE_HIT` (page was just allocated and cached) |
| 5 | `pager-get-out-of-bounds` | `pager get 999` | Shows `ERROR` |
| 6 | `pager-get-max-boundary` | `pager get 100` (TABLE_MAX_PAGES = 100) | Shows `ERROR` |

> [!TIP]
> The pager at this stage does NOT need dirty tracking or LRU eviction. Those are conceptual stretch goals the tutorial can mention but the tests don't require. Keep it simple: get, flush, alloc.

---

## Stage 6: B-Tree Leaf Node & INSERT Execution

### What the student learns
How data is organized inside a page. A leaf node has a header (node type, num_cells) followed by cells (key + row payload). INSERT SQL now works end-to-end by wiring the executor → serialization → btree → pager.

### What the student implements
- Leaf node byte layout constants (header size, cell size, max cells per page)
- `btree_insert(table, key, row_buffer)` — inserts a cell into a leaf page (append at end, no sorting yet — that's Stage 7)
- Wire `execute_insert()` → `serialize_row()` → `btree_insert()`
- The `btree dump` debug command

### Debug command: `btree dump [page_num]`

If `page_num` is omitted, dumps the root page (page 0).

### Output format contract

```
[BTREE] Page 0: type=LEAF num_cells=3
[BTREE]   Cell 0: key=1 (508 bytes)
[BTREE]   Cell 1: key=2 (508 bytes)
[BTREE]   Cell 2: key=3 (508 bytes)
```

Empty page:
```
[BTREE] Page 0: type=LEAF num_cells=0
```

### Test cases

> [!IMPORTANT]
> From this stage onward, tests use actual INSERT SQL to populate data, then debug commands to inspect internal state. The INSERT output itself just needs to not be an error — the btree dump verifies correctness.

| # | Case | Input Sequence | Key assertions |
|---|------|----------------|----------------|
| 1 | `btree-dump-empty` | `btree dump 0` (fresh db) | `type=LEAF num_cells=0` |
| 2 | `btree-insert-one` | INSERT 1 row → `btree dump 0` | `num_cells=1`, `Cell 0: key=1` |
| 3 | `btree-insert-three` | INSERT keys 1, 2, 3 → `btree dump 0` | `num_cells=3`, all three keys present |
| 4 | `btree-insert-shows-key` | INSERT (id=42, ...) → `btree dump 0` | Cell line contains `key=42` |
| 5 | `btree-insert-execution-msg` | INSERT 1 row | Output does NOT contain error code |
| 6 | `btree-dump-nonexistent-page` | `btree dump 99` | Error output |

> [!NOTE]
> **At this stage, cells may be in insertion order, NOT sorted.** Sorting comes in Stage 7. Tests here only verify presence and count, not order.

---

## Stage 7: B-Tree Search & SELECT Execution

### What the student learns
Binary search within a leaf node. How to find a specific key efficiently. Cursor-based sequential scan for SELECT. This is where SELECT SQL starts working.

### What the student implements
- `btree_find(table, key)` — binary search in leaf node, returns row
- Sorted insertion — cells within a leaf are kept in key order
- `execute_select()` — cursor scan through leaf cells, deserialize each row, print
- The `btree find` debug command

### Debug command: `btree find <key>`

### Output format contract

Found:
```
[BTREE] Find key=1: FOUND (page=0 cell=0)
[BTREE] Row: id=1 name='danimar' email='danimar@email.com'
```

Not found:
```
[BTREE] Find key=99: NOT_FOUND
```

### SELECT output format

```
id | name | email
1 | danimar | danimar@email.com
2 | alice | alice@email.com
(2 rows)
```

### Test cases

| # | Case | Input Sequence | Key assertions |
|---|------|----------------|----------------|
| 1 | `btree-find-existing` | INSERT (1, 'dan', 'd@e') → `btree find 1` | `FOUND`, Row line with `id=1` |
| 2 | `btree-find-missing` | `btree find 99` (fresh or populated db) | `NOT_FOUND` |
| 3 | `btree-sorted-insert` | INSERT keys 3, 1, 2 → `btree dump 0` | Cells appear in key order: 1, 2, 3 |
| 4 | `btree-find-after-multiple` | INSERT 5 rows → `btree find` each | All 5 return `FOUND` with correct data |
| 5 | `select-after-insert` | INSERT 2 rows → `select * from users;` | Output contains both rows with column values |
| 6 | `select-empty-table` | `select * from users;` (fresh db) | `(0 rows)` or empty result |
| 7 | `select-row-count` | INSERT 3 rows → `select * from users;` | Output contains `(3 rows)` |
| 8 | `select-column-headers` | INSERT 1 row → `select * from users;` | First line contains `id | name | email` |
| 9 | `btree-duplicate-key` | INSERT key=1 twice | Error: duplicate key |

---

## Stage 8: B-Tree Splits & Internal Nodes

### What the student learns
What happens when a leaf node is full. Splitting a leaf into two halves, creating an internal (non-leaf) node to index them. Tree grows upward.

### What the student implements
- Leaf node capacity constant (max cells per 4KB page)
- Leaf split: when inserting into a full leaf, create a new leaf, distribute cells half-and-half, promote the split key to a parent internal node
- Internal node structure: node type, num_keys, child pointers, keys
- The `btree structure` debug command

### Debug command: `btree structure`

### Output format contract

Single leaf (no splits yet):
```
[BTREE] Tree depth: 1
[BTREE] LEAF (page=0 cells=3 keys=[1,2,3])
```

After a split:
```
[BTREE] Tree depth: 2
[BTREE] INTERNAL (page=2 keys=[4])
[BTREE]   LEAF (page=0 cells=4 keys=[1,2,3,4])
[BTREE]   LEAF (page=1 cells=3 keys=[5,6,7])
```

### Test cases

The max cells per leaf depends on cell size. With a 508-byte row + 4-byte key = 512 bytes per cell, and a 4KB page with a header, you get roughly 7 cells per leaf. Tests should use this boundary.

| # | Case | Input Sequence | Key assertions |
|---|------|----------------|----------------|
| 1 | `btree-no-split-under-limit` | INSERT rows up to (but not exceeding) leaf capacity → `btree structure` | `Tree depth: 1`, single LEAF |
| 2 | `btree-split-on-overflow` | INSERT one row beyond leaf capacity → `btree structure` | `Tree depth: 2`, two LEAF nodes under one INTERNAL |
| 3 | `btree-split-key-distribution` | Force split → dump both leaves | Each leaf has roughly half the keys |
| 4 | `btree-find-after-split` | INSERT enough to split → `btree find` for each inserted key | All keys return `FOUND` |
| 5 | `btree-select-after-split` | INSERT enough to split → `select * from users;` | All rows returned, correct count |
| 6 | `btree-structure-shows-internal` | Force split → `btree structure` | Output contains `INTERNAL` |
| 7 | `btree-insert-order-after-split` | INSERT keys out of order, force split → `select * from users;` | Rows returned in key order |
| 8 | `btree-multi-split` | INSERT enough to force 2+ splits → `btree structure` | 3+ leaf nodes |

---

## Stage 9: Persistence & WHERE Clause

### What the student learns
Data durability — rows survive across sessions. WHERE clause filtering for SELECT. The `--db` flag for controlling the database file path.

### What the student implements
- `--db <path>` CLI flag (replaces hardcoded `"droid.db"`)
- Proper `db_close()` that flushes all dirty pages
- WHERE clause evaluation in the executor
- Cross-session persistence verification

### New CLI behavior
```bash
./c-db                      # uses default "droid.db"
./c-db --db /tmp/test.db    # uses specified path
./c-db -c "select * from users;" --db /tmp/test.db
```

### Test cases

> [!IMPORTANT]
> This is where test isolation becomes critical. Each test case creates a temporary db file, runs the binary with `--db <tmpfile>`, and cleans up after. The test harness manages this.

| # | Case | Input Sequence | Key assertions |
|---|------|----------------|----------------|
| 1 | `persist-insert-reopen` | Session 1: INSERT 1 row → exit. Session 2: `select * from users;` | Row from session 1 appears in session 2 |
| 2 | `persist-multiple-inserts` | Session 1: INSERT 3 rows → exit. Session 2: select | All 3 rows present |
| 3 | `persist-db-flag` | `./c-db --db /tmp/test1.db -c "insert ..."` then `./c-db --db /tmp/test1.db -c "select ..."` | Data persists in specified file |
| 4 | `persist-db-isolation` | INSERT into db1, SELECT from db2 | db2 is empty (separate files) |
| 5 | `where-equals-int` | INSERT 3 rows → `select * from users where id = 2;` | Only row with id=2 returned |
| 6 | `where-no-match` | INSERT 3 rows → `select * from users where id = 99;` | `(0 rows)` |
| 7 | `where-equals-string` | INSERT 3 rows → `select * from users where name = 'danimar';` | Only matching row returned |
| 8 | `db-flag-missing-value` | `./c-db --db` (no path) | Non-zero exit code, error message |

---

## Stage 10: WAL & Crash Recovery (Future)

> [!NOTE]
> Placeholder for future implementation. Your `wal.c` and `wal.h` are stubs. This stage would cover:
> - Write-ahead logging (log before data)
> - Checkpoint (flush WAL to main db)
> - Crash recovery (replay WAL on startup)
> - Test: kill process mid-write, restart, verify data integrity

---

## Infrastructure Changes

### New test files

```
tests/integration/python/
├── stage4/
│   ├── __init__.py
│   └── serialization_tests.py      # 7 test cases
├── stage5/
│   ├── __init__.py
│   └── pager_tests.py              # 6 test cases
├── stage6/
│   ├── __init__.py
│   └── btree_leaf_tests.py         # 6 test cases
├── stage7/
│   ├── __init__.py
│   └── btree_search_tests.py       # 9 test cases
├── stage8/
│   ├── __init__.py
│   └── btree_split_tests.py        # 8 test cases
└── stage9/
    ├── __init__.py
    └── persistence_tests.py         # 8 test cases
```

### Test plan documents

```
tests/integration/
├── STAGE4_SERIALIZATION_TEST_PLAN.md
├── STAGE5_PAGER_TEST_PLAN.md
├── STAGE6_BTREE_LEAF_TEST_PLAN.md
├── STAGE7_BTREE_SEARCH_TEST_PLAN.md
├── STAGE8_BTREE_SPLIT_TEST_PLAN.md
└── STAGE9_PERSISTENCE_TEST_PLAN.md
```

### [run_tests.py](file:///home/danimaribeiro/droid/tests/integration/python/run_tests.py) changes

```python
STAGE_RUNNERS = {
    "stage1": run_stage1_suite,
    "stage2": run_stage2_suite,
    "stage3": run_stage3_suite,
    "stage4": run_stage4_suite,
    "stage5": run_stage5_suite,
    "stage6": run_stage6_suite,
    "stage7": run_stage7_suite,
    "stage8": run_stage8_suite,
    "stage9": run_stage9_suite,
}
```

Update `--stage` choices accordingly.

### [Makefile](file:///home/danimaribeiro/droid/Makefile) changes

Add `test-stage4` through `test-stage9` targets, plus per-language variants.

### DB file isolation strategy

- **Stages 4–5**: Tests don't need isolation. Stage 4 is in-memory only. Stage 5 uses the default db file and tests don't persist across cases (each run is a fresh session).
- **Stages 6–8**: Tests write to the db file. The test harness should **delete any existing `droid.db` before each test case** to ensure a clean state. Since all tests use `droid.db` and run sequentially, this works.
- **Stage 9**: Introduces `--db <path>`. Tests use `tempfile.mkdtemp()` for each case, creating an isolated db file, and clean up after.

### [utils.py](file:///home/danimaribeiro/droid/tests/integration/python/utils.py) changes

Add a helper for stages 6–8 that cleans up the db file:
```python
def run_command_clean_db(binary, test_input, db_file="droid.db", ...):
    """Delete the db file before running, to ensure clean state."""
    if os.path.exists(db_file):
        os.remove(db_file)
    return run_command(binary, test_input, ...)
```

Add a helper for Stage 9+ that uses temp dirs:
```python
def run_command_with_temp_db(binary, test_input, cli_args=None, ...):
    """Create a temp db file for isolation."""
    tmpdir = tempfile.mkdtemp()
    db_path = os.path.join(tmpdir, "test.db")
    args = list(cli_args or []) + ["--db", db_path]
    try:
        return run_command(binary, test_input, cli_args=args, ...)
    finally:
        shutil.rmtree(tmpdir)
```

---

## What Changes in c-droid for Each Stage

### Stage 4 changes
| File | Change |
|------|--------|
| [engine.c](file:///home/danimaribeiro/droid/c-droid/engine.c) | Add `serialize` command handler in `execute_sql()` — parse INSERT, build Row, serialize, deserialize, print `[SERIALIZE]` report |
| [row.c](file:///home/danimaribeiro/droid/c-droid/row.c) | Already implemented ✅ (may need minor adjustments for output format) |

### Stage 5 changes
| File | Change |
|------|--------|
| [engine.c](file:///home/danimaribeiro/droid/c-droid/engine.c) | Add `pager` command handler — dispatch to status/alloc/get subcommands |
| [pager.c](file:///home/danimaribeiro/droid/c-droid/pager.c) | Already has `pager_get_page` and `pager_flush` ✅. Add page count tracking for `pager status` |

### Stage 6 changes
| File | Change |
|------|--------|
| [btree.h](file:///home/danimaribeiro/droid/c-droid/btree.h) | Define leaf node layout constants (HEADER_SIZE, CELL_SIZE, MAX_CELLS) |
| [btree.c](file:///home/danimaribeiro/droid/c-droid/btree.c) | Rewrite `btree_insert` to use proper node layout. Add `btree_dump` function. Currently naive append — needs header tracking |
| [engine.c](file:///home/danimaribeiro/droid/c-droid/engine.c) | Add `btree dump` command handler |
| [executor.c](file:///home/danimaribeiro/droid/c-droid/executor.c) | INSERT already wired ✅ — may need cleanup to match new btree API |

### Stage 7 changes
| File | Change |
|------|--------|
| [btree.c](file:///home/danimaribeiro/droid/c-droid/btree.c) | Implement `btree_find` (currently empty stub). Change insert to maintain sorted key order. Implement cursor/scan for `btree_select_all` |
| [executor.c](file:///home/danimaribeiro/droid/c-droid/executor.c) | Implement `execute_select` (currently returns stub) — call btree scan, deserialize rows, format output |
| [engine.c](file:///home/danimaribeiro/droid/c-droid/engine.c) | Add `btree find` command handler |

### Stage 8 changes
| File | Change |
|------|--------|
| [btree.c](file:///home/danimaribeiro/droid/c-droid/btree.c) | Implement leaf split logic. Add internal node type and structure. Add `btree_print_structure` |
| [btree.h](file:///home/danimaribeiro/droid/c-droid/btree.h) | Add internal node layout constants |
| [engine.c](file:///home/danimaribeiro/droid/c-droid/engine.c) | Add `btree structure` command handler |

### Stage 9 changes
| File | Change |
|------|--------|
| [main.c](file:///home/danimaribeiro/droid/c-droid/main.c) | Add `--db <path>` argument parsing |
| [executor.c](file:///home/danimaribeiro/droid/c-droid/executor.c) | Implement WHERE clause evaluation in `execute_select` |
| [engine.c](file:///home/danimaribeiro/droid/c-droid/engine.c) | Ensure `db_close()` flushes all cached pages |

---

## Stage Dependency & Test Regression Map

Each row shows what tests MUST still pass at that stage:

| Stage | New Tests | Must Also Pass |
|-------|-----------|----------------|
| 4 | serialize-* | stages 1, 2, 3 |
| 5 | pager-* | stages 1, 2, 3, 4 |
| 6 | btree-dump-*, btree-insert-* | stages 1, 2, 3, 4, 5 |
| 7 | btree-find-*, select-* | stages 1, 2, 3, 4, 5, 6 |
| 8 | btree-split-*, btree-structure-* | stages 1, 2, 3, 4, 5, 6, 7 |
| 9 | persist-*, where-* | stages 1–8 |

Run `make test-all-stages` to verify full regression.

---

## Execution Sequence for Implementation

Once approved, the implementation work is:

1. **Create test infrastructure** — stage directories, `__init__.py` files, Makefile targets
2. **Stage 4**: Write `serialization_tests.py` + `STAGE4_*.md` + add `serialize` command to c-droid
3. **Stage 5**: Write `pager_tests.py` + `STAGE5_*.md` + add `pager` commands to c-droid
4. **Stage 6**: Write `btree_leaf_tests.py` + `STAGE6_*.md` + refactor btree.c for proper layout + add `btree dump`
5. **Stage 7**: Write `btree_search_tests.py` + `STAGE7_*.md` + implement sorted insert, find, select
6. **Stage 8**: Write `btree_split_tests.py` + `STAGE8_*.md` + implement splits + `btree structure`
7. **Stage 9**: Write `persistence_tests.py` + `STAGE9_*.md` + add `--db` flag, WHERE, persistence
8. **Update AGENTS.md** with the new stage map
