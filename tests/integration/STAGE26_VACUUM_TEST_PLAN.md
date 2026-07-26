# Stage 26: VACUUM / Compaction

## Concept
Reclaim disk space from deleted and updated rows. After many DELETEs, pages accumulate dead (tombstoned) cells that waste space. VACUUM scans all pages, removes dead cells, compacts live data, and optionally rewrites the entire table file.

## What It Teaches
- **Dead tuple accumulation**: Why databases slow down after many DELETE/UPDATE cycles — pages fill with dead data, scans read more pages than necessary.
- **Online compaction**: Removing dead cells from a page without locking the entire table. Rebuild the slot directory, shift live records, and update free space pointers.
- **Full VACUUM vs incremental**: Full VACUUM rewrites the entire table to a new file (reclaims disk space). Incremental VACUUM compacts individual pages in-place (reclaims page-internal space but doesn't shrink the file).
- **Index cleanup**: When a row is vacuumed from the main table, its entries in secondary indexes must also be removed.

## Learning Objectives
1. Implement a `VACUUM` command that scans all pages and removes tombstoned cells.
2. Implement page compaction: rewrite live records contiguously and update the slot directory.
3. Update free space tracking after compaction.
4. Remove orphaned index entries for vacuumed rows.
5. (Stretch) Implement `VACUUM FULL` that rewrites the table to a new file and swaps.

## New SQL Syntax
```sql
VACUUM users;       -- compact pages in-place
VACUUM FULL users;  -- rewrite entire table
```

## Debug Command
```
[VACUUM] Table users: scanned 15 pages, removed 42 dead cells, reclaimed 21504 bytes
```
