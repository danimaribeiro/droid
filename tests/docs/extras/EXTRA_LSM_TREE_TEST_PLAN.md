# Extra Stage: LSM-Tree (Alternative to B-Tree)

## Concept
Implement a Log-Structured Merge-Tree as an alternative storage engine, showing the student that B-trees are not the only way to organize data on disk.

## What It Teaches
- **Write-optimized storage**: Unlike B-trees (which do random page writes on INSERT), an LSM-tree buffers writes in memory and flushes them as sequential sorted runs. This makes writes dramatically faster.
- **Memtable**: An in-memory sorted data structure (typically a red-black tree or skip list) that accepts all writes. When it reaches a size threshold, it's flushed to disk as a sorted SSTable file.
- **SSTables (Sorted String Tables)**: Immutable, sorted files on disk. Each SSTable contains a sorted sequence of key-value pairs. Once written, an SSTable is never modified.
- **Compaction**: Over time, multiple SSTables accumulate. Compaction merges overlapping SSTables into a single sorted file, removing duplicates and deleted entries. This is similar to merge sort.
- **Read amplification trade-off**: Reads may need to check the memtable + multiple SSTables (worst case: all levels). Bloom filters reduce unnecessary SSTable reads.
- **Leveled compaction**: SSTables are organized into levels. Level 0 has the most recent data. When a level fills up, its SSTables are merged into the next level. This is how LevelDB and RocksDB work.

## Learning Objectives
1. Implement an in-memory memtable using a sorted data structure.
2. Implement SSTable format: sorted key-value pairs with an index block.
3. Implement memtable flush: write sorted memtable to an SSTable file.
4. Implement read path: check memtable first, then SSTables from newest to oldest.
5. Implement compaction: merge two SSTables into one, discarding deleted entries.
6. (Stretch) Implement bloom filters to skip SSTables that don't contain the target key.

## Why This Matters
B-trees are great for read-heavy workloads. LSM-trees are great for write-heavy workloads. Understanding both lets the student reason about storage engine trade-offs — which is why databases like MySQL offer multiple storage engines (InnoDB = B-tree, RocksDB = LSM).
