#include "engine.h"

/* TODO: Implement the SQL execution engine
 *
 * execute_sql(): parse SQL and execute against the B-tree
 *   - INSERT: parse -> serialize -> btree_insert
 *   - SELECT: iterate B-tree -> deserialize -> print rows
 *
 * db_open(): open a database file, initialize the pager and root page
 * db_close(): flush pages and close the file
 *
 * Expected SELECT output:
 *   id | name | email
 *   1 | dan | dan@test.com
 *   2 | alice | alice@test.com
 *   (2 rows)
 *
 * Expected btree find output:
 *   Find key=1: FOUND
 *   Find key=999: NOT_FOUND
 */

void execute_sql(Table *table, char *command) {
    // TODO
}

Table db_open(const char *filename) {
    // TODO
}

void db_close(Table *table) {
    // TODO
}
