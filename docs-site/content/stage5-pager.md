---
stage: 5
title: "The Pager & Buffer Pool"
subtitle: "Managing 4KB blocks as the foundational unit of storage and caching"
section: "Storage Engine & Memory Pool"
objective: "Manage 4KB memory pages as the core unit of storage I/O, providing an in-memory buffer pool cache to avoid redundant physical file reads."
concepts:
  - "The 4KB block as the universal unit of operating system filesystem interaction"
  - "In-Memory Buffer Pool architecture (supporting up to TABLE_MAX_PAGES = 100)"
  - "Dynamic page allocation versus Cache Hit and Cache Miss dynamics"
  - "Strict bounds checking to reject unallocated page lookups without crashing"
algorithms:
  - title: "4KB Page Allocation Lifecycle"
    description: "When the database requires space for a new B-Tree leaf or internal node, it requests a fresh page from the Pager rather than invoking raw OS memory allocations scattered across the heap."
    steps:
      - "Verify that the current total page count has not exceeded the designated pool threshold (TABLE_MAX_PAGES = 100)."
      - "Allocate a clean, zero-padded memory buffer of exactly PAGE_SIZE (4096 bytes)."
      - "Assign the newly created memory address to the cache table at index N (where N equals the prior total page count)."
      - "Increment the Pager's total_pages tracking integer and print allocation confirmation via '[PAGER] Alloc: page N (4096 bytes, zeroed)'."
  - title: "Buffer Cache Lookup & Retrieval Engine"
    description: "Any upstream component (such as a B-Tree iterator or sequential scanner) must acquire page access exclusively through the Pager retrieve function."
    steps:
      - "Intercept page retrieval instruction 'pager get N'. Validate that requested index N is strictly within valid operational bounds (N >= 0 and N < total_pages)."
      - "If N is out of bounds (such as index 999 on a 2-page database), immediately interrupt execution and emit '[PAGER] Get page N: ERROR (page out of bounds)' without generating a segmentation fault."
      - "If N is within valid bounds, inspect the in-memory cache pointer table at index N."
      - "If the table entry holds an active memory pointer, signal immediate success and report '[PAGER] Get page N: CACHE_HIT'."
      - "If the entry is null, invoke disk I/O routines to populate the page from the persistence layer and report '[PAGER] Get page N: CACHE_MISS (loaded from disk)'."
checklist:
  - "Define foundational storage constants: PAGE_SIZE (4096) and TABLE_MAX_PAGES (100)"
  - "Implement Pager state management struct with page pointer array and size trackers"
  - "Implement 'pager status' to output total page boundaries and active cache occupancy"
  - "Implement 'pager alloc' to dynamically initialize clean 4KB zeroed buffers"
  - "Implement 'pager get <N>' to evaluate page presence and distinguish CACHE_HIT from CACHE_MISS"
  - "Guarantee bounds safety on 'pager get <N>' queries exceeding current database capacities"
---

## The Atomic Unit of Storage (Why 4KB?)

In high-performance systems engineering, a database storage engine never reads or writes individual table rows directly to physical storage. Asking an Operating System to read a 60-byte tuple off disk thousands of times per second would generate catastrophic I/O amplification and destroy mechanical or NVMe drive lifespans.

Instead, production engines (such as SQLite, PostgreSQL, and InnoDB) group records into uniform, atomic memory blocks called **Pages**. In this stage, you will design your engine around a strict **4KB (4096 Bytes)** standard page size. 

Why 4096 bytes?
1. **Operating System Alignment**: Practically all modern virtual memory systems and Linux OS architectures natively manage RAM using 4KB pages.
2. **Filesystem Efficiency**: Standard solid-state storage clusters read and erase sectors in multiples of 4KB. Aligning database blocks with hardware physics guarantees maximum read throughput and zero boundary crossover overhead.

## The Anatomy of a Buffer Pool

The **Pager** serves as the vital caching interface sitting between your physical persistence filesystem (Stage 9) and the in-memory B-Tree indexing layer (Stage 6). Think of the Pager as an intelligent memory broker:

```
┌────────────────────────────────────────────────────────┐
│               B-Tree Node / Query Engine               │
└───────────────────────────┬────────────────────────────┘
                            │  "Give me Page #0"
                            ▼
┌────────────────────────────────────────────────────────┐
│           PAGER & BUFFER POOL (Cache Layer)            │
│  ├── Page 0 [ 4096-byte memory block ] -> CACHE_HIT    │
│  ├── Page 1 [ NULL pointer           ] -> CACHE_MISS   │
│  └── Page 2 [ Unallocated Out of Bounds ] -> ERROR     │
└───────────────────────────┬────────────────────────────┘
                            │  (Fetch only on miss)
                            ▼
┌────────────────────────────────────────────────────────┐
│             Persistent File System Storage             │
└────────────────────────────────────────────────────────┘
```

When upstream algorithms query data, they call your Pager's retrieval interface. If the requested block already sits inside our **Buffer Pool** array (`TABLE_MAX_PAGES`), the Pager serves a zero-cost **Cache Hit**. Only when a valid block is absent from the pool does the Pager initiate a hardware **Cache Miss**, loading the targeted bytes directly from durable storage.
