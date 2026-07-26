# Extra Stage: Page Compression

## Concept
Implement transparent page-level compression to reduce disk I/O and storage space, at the cost of CPU time for compression and decompression.

## What It Teaches
- **Transparent compression**: The pager compresses pages before writing to disk and decompresses after reading. All layers above the pager (B-tree, executor) are unaware of compression — they always see uncompressed 4KB pages.
- **Compression algorithms**: LZ4 (fast, moderate ratio), Snappy (fastest, lower ratio), zlib/zstd (slower, best ratio). The student implements one and learns the trade-offs.
- **CPU vs I/O trade-off**: Compression adds CPU cost but reduces disk I/O. For disk-bound workloads, compression makes things faster (less data to read/write). For CPU-bound workloads, it makes things slower.
- **Compression ratio**: Depends on data patterns. Columns with repeated values (e.g., country codes) compress very well. Random data (e.g., UUIDs) barely compresses.
- **Page alignment**: Compressed pages are smaller than 4KB. The student must handle variable-length pages on disk, or pad to 4KB boundaries (simpler but wastes space).

## Learning Objectives
1. Implement a simple compression algorithm (run-length encoding or LZ77 subset) or integrate a library (LZ4/snappy).
2. Modify `pager_write_page()` to compress before writing.
3. Modify `pager_read_page()` to decompress after reading.
4. Track compression ratio statistics.
5. Ensure all existing tests pass transparently (B-tree, SELECT, persistence).

## Debug Command: `pager compression-stats`
```
[PAGER] Compression: enabled (LZ4)
[PAGER]   Pages written: 15
[PAGER]   Avg compression ratio: 3.2x
[PAGER]   Disk usage: 18KB (vs 60KB uncompressed)
```
