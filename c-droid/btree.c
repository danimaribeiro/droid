// btree.c

#include "table.h"
#include "pager.c"

void btree_init_leaf_node(void* page) {
    // TODO: Write LEAF node type flag and initialize cell counter to zero
    printf("[ERROR:00101] B+Tree leaf initialization not implemented yet.\n");
}

void btree_insert(Table* table, Row* row) {
    // TODO: Fetch root leaf page from Pager, locate insertion slot, and write serialized row cell
    printf("[ERROR:00101] B+Tree INSERT execution not implemented yet.\n");
}

void btree_dump(Table* table, uint32_t page_num) {
    // TODO: Dump node type, total occupancy count, and list primary keys for debugging
    printf("[ERROR:00101] btree dump command not implemented yet.\n");
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