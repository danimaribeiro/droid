# Extra Stage: PostgreSQL Wire Protocol & Client/Server

## Concept
Transform the single-process REPL into a TCP server that speaks the PostgreSQL v3 wire protocol, so standard tools like `psql`, `pgcli`, and any PostgreSQL driver can connect directly.

## Why PostgreSQL Protocol (Not Custom)
- `psql` already exists — no need to build a client
- Every PostgreSQL driver (Python psycopg2, Node pg, Go pgx, JDBC) works out of the box
- The v3 protocol is well-documented and surprisingly simple for a basic subset
- The student's toy database becomes something real tools can talk to

## What It Teaches
- **Binary protocol engineering**: Designing message framing, type codes, and payload formats for efficient network communication.
- **Connection lifecycle**: Startup → authentication → query loop → termination. Each phase has specific message types.
- **Streaming results over TCP**: The executor's Volcano model maps perfectly to the wire protocol — each `Next()` call produces one `DataRow` message sent immediately over the socket.
- **Server event loop**: A simple single-threaded accept loop that handles one connection at a time (multi-threaded is a stretch goal).

## Minimum Subset for `psql` Compatibility

Only **8 message types** are needed:

### Startup Phase (connection init)

| Step | Direction | Message | What it does |
|------|-----------|---------|-------------|
| 1 | Client → Server | `StartupMessage` | Protocol version (3.0) + username |
| 2 | Server → Client | `AuthenticationOk` | No password required |
| 3 | Server → Client | `ParameterStatus` × N | server_version, client_encoding, etc. |
| 4 | Server → Client | `ReadyForQuery` | Status byte: `I` (idle) |

### Query Phase (repeats for each query)

| Step | Direction | Message | What it does |
|------|-----------|---------|-------------|
| 5 | Client → Server | `Query` | SQL string |
| 6 | Server → Client | `RowDescription` | Column names + types |
| 7 | Server → Client | `DataRow` × N | One per result row (STREAMED) |
| 8 | Server → Client | `CommandComplete` | "SELECT 3" or "INSERT 0 1" |
| 9 | Server → Client | `ReadyForQuery` | Ready for next query |

### Error & Terminate

| Step | Direction | Message | What it does |
|------|-----------|---------|-------------|
| — | Server → Client | `ErrorResponse` | Error with severity, code, message |
| — | Client → Server | `Terminate` | Close connection |

## Message Format

Every message (except StartupMessage) has:
```
[type:1 byte][length:4 bytes (includes self)][payload:N bytes]
```

The StartupMessage is special — no type byte:
```
[length:4][protocol_version:4 = 196608 (3.0)][param_name\0param_value\0...\0]
```

### Key Type Bytes

| Byte | Name | Direction |
|------|------|-----------|
| `Q` | Query | client → server |
| `X` | Terminate | client → server |
| `R` | Authentication | server → client |
| `S` | ParameterStatus | server → client |
| `T` | RowDescription | server → client |
| `D` | DataRow | server → client |
| `C` | CommandComplete | server → client |
| `E` | ErrorResponse | server → client |
| `Z` | ReadyForQuery | server → client |

## Streaming Architecture

The wire protocol is where the Volcano model's streaming nature shines:

```c
void handle_query(Connection *conn, const char *sql) {
    // Parse → Plan → Execute (same as REPL)
    AST *ast = parse(sql);
    PlanNode *plan = plan_query(ast);
    
    // Send column metadata ONCE
    send_row_description(conn, plan->columns, plan->num_columns);
    
    // Stream rows ONE AT A TIME via Volcano Next()
    plan->init(plan);
    Row *row;
    int count = 0;
    while ((row = plan->next(plan)) != NULL) {
        send_data_row(conn, row);   // serialize + send over TCP
        count++;                     // only 1 row in memory at a time!
    }
    plan->close(plan);
    
    // Done
    char tag[32];
    snprintf(tag, sizeof(tag), "SELECT %d", count);
    send_command_complete(conn, tag);
    send_ready_for_query(conn, 'I');
}
```

**Memory: O(1)** — 10 rows or 10 million rows, same memory usage.

## Example: What `psql` Sees

```
$ psql -h localhost -p 5433 -U droid
droid=> SELECT * FROM users;
 id |  name   |     email
----+---------+-----------------
  1 | danimar | danimar@e.com
  2 | alice   | alice@e.com
(2 rows)

droid=> \dt
        List of relations
 Schema | Name  | Type  | Owner
--------+-------+-------+-------
 public | users | table | droid
(1 row)
```

> [!NOTE]
> `\dt` sends an internal query to `pg_catalog` tables. The student can intercept these and return results from their own catalog. This is optional — `psql` works fine even if `\dt` returns an error.

## Implementation Complexity

The minimum server is approximately:
- **~150 lines**: TCP accept loop + message reading/writing
- **~100 lines**: Message serialization (RowDescription, DataRow, etc.)
- **~50 lines**: Startup handshake (AuthenticationOk + ParameterStatus)
- **Total: ~300 lines of C** for a working `psql`-compatible server

## Learning Objectives
1. Implement a TCP server that listens on `--port N` (default 5433).
2. Implement the startup handshake (read StartupMessage, send AuthOk + ParameterStatus + ReadyForQuery).
3. Implement the Simple Query protocol (read Query, execute, stream DataRow messages).
4. Implement ErrorResponse for query errors.
5. Handle client disconnect gracefully.
6. Verify that `psql` can connect and execute SELECT, INSERT, CREATE TABLE.
7. (Stretch) Handle `\dt` by intercepting the internal catalog query.
8. (Stretch) Support multiple sequential connections (one at a time).

## CLI Usage
```bash
# Start server
./c-db --server --port 5433 --db mydata.db

# Connect with psql (another terminal)
psql -h localhost -p 5433 -U droid

# Or with any PostgreSQL driver
python3 -c "import psycopg2; conn = psycopg2.connect(port=5433)"
```

## Reference
PostgreSQL v3 wire protocol specification:
https://www.postgresql.org/docs/current/protocol-message-formats.html

## Why This Matters
This is the moment the toy database becomes **real**. Standard tools connect to it. The student can open `psql` in one terminal, insert data, open `psql` in another terminal, and query it. The wire protocol is the API contract between the database and the entire ecosystem.
