# Stage 5: The Pager & Buffer Pool Test Plan

This document outlines the testing strategy for the Pager & Buffer Pool stage (Stage 5) in all language implementations.

## Stage 5 Objectives
1. Manage 4KB pages as the unit of disk I/O.
2. Provide an in-memory cache for pages (avoid redundant disk reads).
3. Support page allocation, retrieval, and flushing.

## Debug Commands

| Command | Behavior |
|---------|----------|
| `pager status` | Print total pages and cached page count |
| `pager alloc` | Allocate a new zeroed page, print its number |
| `pager get <N>` | Load page N into cache, report hit/miss |

### Output Format Contract

```
[PAGER] Status: total_pages=0 cached=0
[PAGER] Alloc: page 0 (4096 bytes, zeroed)
[PAGER] Get page 0: CACHE_HIT
[PAGER] Get page 5: CACHE_MISS (loaded from disk)
[PAGER] Get page 999: ERROR (page out of bounds)
```

## Test Cases

All tests are in `tests/integration/python/stage5/pager_tests.py` and run via `make test-stage5`.

Each test case deletes `droid.db` before running to ensure a clean state.

### 1. `pager-status-fresh`
- **Input**: `pager status`
- **Expected**: `[PAGER] Status:` and `total_pages=0`

### 2. `pager-alloc-first`
- **Input**: `pager alloc`
- **Expected**: `[PAGER] Alloc:` and `page 0`

### 3. `pager-status-after-alloc`
- **Input**: `pager alloc` then `pager status`
- **Expected**: `total_pages=1`

### 4. `pager-get-cached`
- **Input**: `pager alloc` then `pager get 0`
- **Expected**: `[PAGER] Get page 0:` and `CACHE_HIT`

### 5. `pager-get-out-of-bounds`
- **Input**: `pager get 999`
- **Expected**: `ERROR` in output

### 6. `pager-alloc-multiple`
- **Input**: `pager alloc` × 3 then `pager status`
- **Expected**: `total_pages=3`

## Pager Constants

| Constant | Value |
|----------|-------|
| PAGE_SIZE | 4096 bytes |
| TABLE_MAX_PAGES | 100 |

## How to Run

```bash
make test-stage5          # all binaries
make test-c-stage5        # C only
```
