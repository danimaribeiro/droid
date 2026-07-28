// btree.c

#include "table.h"
#include "pager.c"

#define LEAF_NODE_TYPE       0x00
#define INTERNAL_NODE_TYPE   0x01

#define IS_ROOT_TRUE         1
#define IS_ROOT_FALSE        0

#define LEAF_NODE_TYPE_OFFSET        0
#define IS_ROOT_OFFSET               1
#define LEAF_NODE_NUM_CELLS_OFFSET   2
#define LEAF_NODE_HEADER_SIZE        8


void btree_init_leaf_node(void* page) {
    *(uint8_t*)(page + LEAF_NODE_TYPE_OFFSET) = LEAF_NODE_TYPE;
    *(uint8_t*)(page + IS_ROOT_OFFSET) = IS_ROOT_TRUE;
    *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET) = 0;
}

void btree_insert(Table* table, Row* row) {
    uint32_t page_num = table->root_page;
    void *page = pager_get_page(table->pager, page_num);

    uint32_t num_cells = *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET);

    // Key size + Value size (64 bytes)
    uint32_t cells_offset = num_cells * (4 + ROW_SIZE);

    // Key
    *(uint32_t*)(page + LEAF_NODE_HEADER_SIZE + cells_offset) = row->id;

    // Value
    serialize_row(row, (char*)(page + LEAF_NODE_HEADER_SIZE + cells_offset + 4));

    // Update number of cells
    num_cells++;
    *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET) = num_cells;

    pager_flush(table->pager, page_num);
}

void btree_dump(Table* table, uint32_t page_num) {
    if (page_num >= table->pager->num_pages) {
        printf("[ERROR:00601] Page %u out of bounds (allocated: %u)\n", page_num, table->pager->num_pages);
        return;
    }

    void* page = pager_get_page(table->pager, page_num);
    uint8_t node_type = *(uint8_t*)(page + LEAF_NODE_TYPE_OFFSET);
    uint32_t num_cells = *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET);

    const char* type_str = (node_type == LEAF_NODE_TYPE) ? "LEAF" : "INTERNAL";
    printf("[BTREE] Page %u: type=%s num_cells=%u\n", page_num, type_str, num_cells);

    uint32_t cell_size = 4 + ROW_SIZE; // 64 bytes
    for (uint32_t i = 0; i < num_cells; i++) {
        uint32_t cell_offset = LEAF_NODE_HEADER_SIZE + (i * cell_size);
        uint32_t key = *(uint32_t*)(page + cell_offset);
        printf("[BTREE]   Cell %u: key=%u (%d bytes)\n", i, key, ROW_SIZE);
    }
}


void btree_insert_old(Table *table, int key, char *row_buffer) {
    int page_num = table->pager->num_pages > 0 ? table->pager->num_pages - 1 : 0;
    void *page = pager_get_page(table->pager, page_num);

    uint32_t *num_cells = (uint32_t *)page;
    if (*num_cells >= 64) {
        page_num++;
        page = pager_get_page(table->pager, page_num);
        num_cells = (uint32_t*)page;
        (*num_cells) = 0;
    }

    uint32_t offset = sizeof(uint32_t) + ((*num_cells) * ROW_SIZE);

    memcpy(page + offset, row_buffer, ROW_SIZE);

    (*num_cells)++;
    pager_flush(table->pager, page_num);
}

void btree_select_all(Table *table) {

}

Row* btree_find(Table *table, int key) {
    
}