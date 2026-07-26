# Database Internals — Topics to Research

Advanced and modern database concepts to potentially add as future tutorial stages. These represent cutting-edge techniques used in production databases today.

---

## Storage & Performance

### Columnar Storage
Store data by column instead of by row. All `id` values together, all `name` values together. Analytical queries (SUM, AVG, COUNT) read only the columns they need — 10-100x faster for OLAP workloads. The student already has a row-store; building a column-store shows the fundamental trade-off (fast writes vs fast analytics).

**Used by:** DuckDB, ClickHouse, Apache Parquet, Amazon Redshift, Google BigQuery

### Vectorized Execution
Instead of the Volcano model's one-row-at-a-time `Next()`, process batches of ~1000 rows per call via `NextBatch()`. Exploits CPU cache lines and SIMD instructions. Can coexist with Volcano by adding a batch-aware execution mode.

**Used by:** DuckDB, Velox (Meta), DataFusion (Apache Arrow)

### Buffer Pool with Clock / LRU-K Eviction
The current buffer pool uses simple eviction. Real databases use sophisticated algorithms: Clock (PostgreSQL), LRU-K (SQL Server), or ARC (adaptive). These avoid evicting "hot" pages that are accessed frequently.

**Used by:** PostgreSQL (Clock), SQL Server (LRU-K), ZFS (ARC)

### Zone Maps / Min-Max Indexes
Each page stores the minimum and maximum value of each column. The executor can skip entire pages without reading them if the WHERE filter falls outside the range. Zero overhead on INSERT — just update min/max on write.

**Used by:** Amazon Redshift, Snowflake, DuckDB, Netezza

### Bloom Filters
A probabilistic data structure that answers "is this key possibly in this page/SSTable?" with no false negatives and rare false positives. Saves I/O by skipping pages that definitely don't contain the target key.

**Used by:** PostgreSQL (BRIN indexes), LevelDB, RocksDB, Cassandra

### Dictionary Encoding
Replace repeated string values with integer codes from a dictionary. A column with 1 million rows but only 50 distinct country names stores 50 strings + 1M integers instead of 1M strings. Massive compression for low-cardinality columns.

**Used by:** Parquet, ORC, DuckDB, Vertica

---

## Distributed & Cloud-Native

### Sharding (Horizontal Partitioning)
Partition data across multiple servers using a hash or range key. A query router examines the WHERE clause to determine which shard to query. Enables scaling beyond a single machine.

**Used by:** CockroachDB, Vitess (YouTube/Google), Citus (PostgreSQL), MongoDB

### Raft Consensus
Replicate the WAL across 3+ nodes for fault tolerance. If the leader crashes, followers elect a new leader. Guarantees that committed data is never lost even if machines fail.

**Used by:** CockroachDB, TiDB, etcd, Consul

### Separation of Storage and Compute
Storage lives on a remote service (S3, EBS); compute nodes are stateless and scale independently. The WAL goes to remote storage. Compute nodes can be spun up/down without moving data.

**Used by:** Neon (PostgreSQL), Amazon Aurora, Snowflake, Google AlloyDB

### Change Data Capture (CDC)
Publish a stream of all data changes (INSERT/UPDATE/DELETE) to external consumers. The WAL becomes an event log that other systems can subscribe to. Enables real-time data pipelines.

**Used by:** Debezium, PostgreSQL Logical Replication, MySQL Binlog, DynamoDB Streams

### Multi-Region / Geo-Distributed
Data is replicated across geographic regions for low-latency reads worldwide. Write conflicts are resolved using CRDTs, last-writer-wins, or consensus protocols.

**Used by:** CockroachDB, Spanner (Google), Cosmos DB (Microsoft), YugabyteDB

---

## Query Processing

### JIT Compilation
Compile SQL expressions into native machine code (via LLVM or a lightweight compiler) at runtime. Complex expressions like `WHERE price * quantity > 1000 AND status != 'cancelled'` execute 2-5x faster as compiled code than as interpreted AST walks.

**Used by:** PostgreSQL (>=11, via LLVM), DuckDB, Hyper (Tableau)

### Adaptive Query Execution
The planner creates a plan based on statistics, but adjusts it MID-EXECUTION if actual row counts differ from estimates. If a nested loop join is too slow (more rows than expected), switch to a hash join without restarting.

**Used by:** Apache Spark (AQE), Oracle Adaptive Plans

### Morsel-Driven Parallelism
Divide the work into small chunks ("morsels") and distribute them across CPU cores. Each core processes its morsel independently. Enables intra-query parallelism — a single SELECT uses all CPU cores.

**Used by:** Hyper (Tableau), DuckDB, Umbra

### Pushdown Predicates
Push WHERE filters as close to the storage layer as possible. If storage is remote (Parquet files on S3), the filter travels with the read request — the remote side filters before sending data back. Reduces network transfer dramatically.

**Used by:** DataFusion, Apache Spark, Presto/Trino, Snowflake

### Coroutine-Based Execution
Replace the Volcano iterator's virtual function calls with coroutines (stackful or stackless). Each operator is a coroutine that yields rows. Eliminates function pointer overhead and improves branch prediction.

**Used by:** Research (VLDB papers), some experimental engines

---

## Modern Formats

### Apache Arrow (In-Memory Format)
A standardized columnar format for data in memory. Zero-copy sharing between languages (C, Python, Java, Rust). The "interchange format" of the modern data stack. Not a database, but the memory format that many databases use internally.

**Used by:** DuckDB, Polars, DataFusion, Spark, pandas (via PyArrow)

### Parquet (Disk Format)
A columnar file format for disk with per-column compression, dictionary encoding, and predicate pushdown support. The "universal format" of data lakes. Row groups enable parallel reading.

**Used by:** Spark, DuckDB, BigQuery, Athena, every data lake

### BSON / MessagePack / FlatBuffers
Binary serialization formats for semi-structured data. BSON (MongoDB) is JSON-like but binary. FlatBuffers (Google) provides zero-copy access without parsing. Each makes different trade-offs between read speed, write speed, and flexibility.

**Used by:** MongoDB (BSON), game engines (FlatBuffers), IoT (MessagePack)

---

## Security & Compliance

### Row-Level Security (RLS)
Policies that automatically filter rows based on the connected user. `WHERE user_id = current_user()` is transparently added to every query. The application doesn't need to implement access control — the database enforces it.

**Used by:** PostgreSQL, Supabase, SQL Server, Oracle

### Encryption at Rest (TDE)
Encrypt pages before writing to disk. Transparent Data Encryption — the application sees plaintext, the disk sees ciphertext. The encryption key stays in memory; data at rest is unreadable without it.

**Used by:** PostgreSQL (pgcrypto/TDE), MySQL, SQL Server, Oracle

### Audit Log
Record who executed which query, when, and what the result was. Required for compliance (SOC2, HIPAA, GDPR). Can be implemented as a special write to the WAL or a separate audit table.

**Used by:** All enterprise databases, AWS RDS Audit, GCP Cloud SQL

---

## Observability & Operations

### Query Profiling & pg_stat_statements
Track execution statistics for every unique query pattern: call count, total time, mean time, rows returned. Identify slow queries without EXPLAIN ANALYZE on every query.

**Used by:** PostgreSQL (pg_stat_statements), MySQL (Performance Schema)

### Connection Pooling
Maintain a pool of pre-established database connections that are shared across application threads. Creating a TCP connection + authentication for every query is expensive. Poolers like PgBouncer multiplex thousands of application connections onto a few database connections.

**Used by:** PgBouncer, pgcat, ProxySQL, HikariCP (Java)

### Online Schema Migrations
Change table schemas without downtime or locking. `ALTER TABLE ADD COLUMN` in PostgreSQL is instant (just updates the catalog). But `ALTER TABLE ... ALTER COLUMN TYPE` requires rewriting every row — online migration tools do this in the background while the table remains readable.

**Used by:** gh-ost (GitHub), pt-online-schema-change (Percona), pg_repack

---

## Emerging / Research

### Learned Indexes
Replace B-trees with machine learning models that predict the position of a key. A simple linear regression can approximate a sorted index with fewer cache misses than a B-tree. Still experimental but fascinating.

**Research:** "The Case for Learned Index Structures" (Kraska et al., 2018)

### Persistent Memory (PMEM)
Intel Optane and CXL memory sit between DRAM and SSD — byte-addressable like RAM but persistent like disk. Eliminates the need for WAL in some architectures because writes to memory ARE durable.

**Used by:** Research engines, SAP HANA, some Intel Optane-optimized systems

### Disaggregated Memory
Separate memory pools accessible over a network fabric (RDMA). Multiple compute nodes share a remote memory pool. Enables memory scaling beyond a single machine without the latency of disk.

**Research:** Active area at Google, Microsoft, Meta

### HTAP (Hybrid Transactional/Analytical Processing)
A single database that handles both OLTP (INSERT/UPDATE, row-by-row) and OLAP (analytics, columnar scans) workloads. Usually done with a row-store for writes and a background process that converts data to columnar format for reads.

**Used by:** TiDB (TiFlash), SingleStore, AlloyDB (Google), Hekaton (SQL Server)

### Vector Search / AI-Native Databases
Store and search high-dimensional vectors (embeddings from ML models). Support operations like "find the 10 nearest neighbors to this vector" using HNSW or IVF indexes. The hottest trend in 2024-2025 databases.

**Used by:** pgvector (PostgreSQL), Pinecone, Weaviate, Milvus, Qdrant
