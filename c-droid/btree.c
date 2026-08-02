// btree.c

#include "table.h"
#include "btree.h"
#include "pager.c"

#define LEAF_NODE_TYPE       0x00
#define INTERNAL_NODE_TYPE   0x01

#define IS_ROOT_TRUE         1
#define IS_ROOT_FALSE        0

#define LEAF_NODE_TYPE_OFFSET        0
#define IS_ROOT_OFFSET               1
#define LEAF_NODE_NUM_CELLS_OFFSET   2
#define LEAF_NODE_HEADER_SIZE        8


void* cursor_value(Cursor* cursor) {
    void* page = pager_get_page(cursor->table->pager, cursor->page_num);
    uint32_t cell_offset = LEAF_NODE_HEADER_SIZE + (cursor->cell_num * (4 + ROW_SIZE));
    return page + cell_offset;
}

void btree_init_leaf_node(void* page) {
    *(uint8_t*)(page + LEAF_NODE_TYPE_OFFSET) = LEAF_NODE_TYPE;
    *(uint8_t*)(page + IS_ROOT_OFFSET) = IS_ROOT_TRUE;
    *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET) = 0;
}

void btree_insert(Table* table, Row* row) {
    uint32_t page_num = table->root_page;
    void *page = pager_get_page(table->pager, page_num);

    uint32_t num_cells = *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET);

    Cursor cursor;
    bool found = btree_find(table, row->id, &cursor);

    if (found) {
        printf("[ERROR:00601] Key %u already exists\n", row->id);
        return;
    }

    void* cell_ptr = cursor_value(&cursor);
    uint32_t cell_size = 4 + ROW_SIZE;

    // Check if we have cells after the cursor
    if (cursor.cell_num < num_cells) {
        uint32_t cells_to_shift = num_cells - cursor.cell_num;
        uint32_t bytes_to_shift = cells_to_shift * cell_size;

        memmove(cell_ptr + cell_size, cell_ptr, bytes_to_shift);
    }

    // Key
    *(uint32_t*)(cell_ptr) = row->id;

    // Value
    serialize_row(row, (char*)(cell_ptr + 4));

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

void btree_select_all(Table *table) {

}

bool btree_find(Table *table, int key, Cursor* cursor) {
    uint32_t page_num = table->root_page;
    void *page = pager_get_page(table->pager, page_num);

    uint32_t num_cells = *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET);

    int left = 0;
    int right = num_cells;

    while (left < right) {
        uint32_t mid = left + (right - left) / 2;
        uint32_t key_at_mid = *(uint32_t*)(page + LEAF_NODE_HEADER_SIZE + (mid * (4 + ROW_SIZE)));
        if (key_at_mid == key) {
            left = mid;
            break;
        } else if (key_at_mid < key) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    
    cursor->table = table;
    cursor->page_num = table->root_page;
    cursor->cell_num = left; // From your binary search loop
    cursor->is_eof = (left >= num_cells);

    if (left < num_cells) {
        uint32_t key_at_left = *(uint32_t*)(page + LEAF_NODE_HEADER_SIZE + (left * (4 + ROW_SIZE)));
        return (key_at_left == key);
    }
    return false;
}

void table_start(Table* table, Cursor* cursor) {
    cursor->table = table;
    cursor->page_num = table->root_page;
    cursor->cell_num = 0;

    void* page = pager_get_page(table->pager, cursor->page_num);
    uint32_t num_cells = *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET);
    cursor->is_eof = (num_cells == 0);
}

void cursor_advance(Cursor* cursor) {
    void* page = pager_get_page(cursor->table->pager, cursor->page_num);
    uint32_t num_cells = *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET);

    cursor->cell_num += 1;
    if (cursor->cell_num >= num_cells) {
        cursor->is_eof = true;
    }
}