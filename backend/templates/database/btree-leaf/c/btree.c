#include "btree.h"

/* TODO: Implement B-Tree leaf node operations
 *
 * Page layout for a leaf node:
 *   - Header: node_type (1 byte), num_cells (4 bytes), ...
 *   - Cells: each cell = key (4 bytes) + row data (ROW_SIZE bytes)
 *
 * btree_init_leaf_node(): initialize a page as an empty leaf
 * btree_insert():         insert a row into the B-tree
 * btree_dump():           print the B-tree page structure
 *
 * Expected output for dump:
 *   [BTREE] Page 0: type=LEAF num_cells=3
 *   [BTREE]   Cell 0: key=1
 *   [BTREE]   Cell 1: key=2
 *   [BTREE]   Cell 2: key=3
 */

void btree_init_leaf_node(void *page) {
    // TODO
}

void btree_insert(Table *table, Row *row) {
    // TODO
}

void btree_dump(Table *table, uint32_t page_num) {
    // TODO
}
