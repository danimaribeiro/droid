// btree.c

#include "table.h"
#include "btree.h"
#include "pager.c"

#define LEAF_NODE_MAX_CELLS 8
#define INTERNAL_NODE_MAX_KEYS 3

#define LEAF_NODE_TYPE       0x00
#define INTERNAL_NODE_TYPE   0x01

#define IS_ROOT_TRUE         1
#define IS_ROOT_FALSE        0

/* Offsets used for all nodes */
#define NODE_TYPE_OFFSET        0
#define IS_ROOT_OFFSET               1

/* Offsets used for leaf nodes */
#define LEAF_NODE_NUM_CELLS_OFFSET   2
#define LEAF_NODE_NEXT_LEAF_OFFSET  6
#define LEAF_NODE_HEADER_SIZE        10

/* Offsets used for internal nodes */
#define INTERNAL_NODE_NUM_KEYS_OFFSET       2
#define INTERNAL_NODE_RIGHT_CHILD_OFFSET    6
#define INTERNAL_NODE_HEADER_SIZE           10

/* Bytes per cell in internal nodes */
#define INTERNAL_NODE_KEY_AND_CHILD_SIZE    8

void* cursor_value(Cursor* cursor) {
    void* page = pager_get_page(cursor->table->pager, cursor->page_num);
    uint32_t cell_offset = LEAF_NODE_HEADER_SIZE + (cursor->cell_num * (4 + ROW_SIZE));
    return page + cell_offset;
}

void btree_init_leaf_node(void* page) {
    *(uint8_t*)(page + NODE_TYPE_OFFSET) = LEAF_NODE_TYPE;
    *(uint8_t*)(page + IS_ROOT_OFFSET) = IS_ROOT_FALSE;
    *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET) = 0;
    *(uint32_t*)(page + LEAF_NODE_NEXT_LEAF_OFFSET) = 0; // next_leaf = 0
}

void btree_init_internal_node(void* page) {
    *(uint8_t*)(page + NODE_TYPE_OFFSET) = INTERNAL_NODE_TYPE;
    *(uint8_t*)(page + IS_ROOT_OFFSET) = IS_ROOT_FALSE;
    *(uint32_t*)(page + INTERNAL_NODE_NUM_KEYS_OFFSET) = 0;
}

void ensure_root_page(Table* table) {
    if (table->pager->num_pages == 0) {
        void* page = pager_alloc_page(table->pager);
        btree_init_leaf_node(page);
        *(uint8_t*)(page + IS_ROOT_OFFSET) = IS_ROOT_TRUE;
    }
}

void leaf_node_insert(Cursor* cursor, Row* row) {
    void* page = pager_get_page(cursor->table->pager, cursor->page_num);
    uint32_t num_cells = *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET);
    void* cell_ptr = cursor_value(cursor);
    uint32_t cell_size = 4 + ROW_SIZE;

    // Check if we have cells after the cursor
    if (cursor->cell_num < num_cells) {
        uint32_t cells_to_shift = num_cells - cursor->cell_num;
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
}

/*
 * TODO (Amanhã): Implementar o Split de Nós Internos (Stage 9)
 * 
 * Passos para o Split Interno:
 * 1. Checar Estouro: Se num_keys >= INTERNAL_NODE_MAX_KEYS, acionar o split.
 * 2. Criar Novo Nó: Alocar nova página (right_page) no Pager.
 * 3. Partir Chaves: Distribuir chaves e ponteiros entre o nó antigo (left) e o novo (right).
 * 4. Promover Mediana: A chave central SOBE para o pai (diferente da folha, ela não se duplica).
 * 5. Tratar Raiz / Recursão: Se for a Raiz, criar nova raiz (profundidade +1). Se não, chamar recursivo no pai.
 */
void internal_node_split_and_insert(Table* table, uint32_t parent_page_num, uint32_t key, uint32_t child_page_num) {
    // Implementar a lógica amanhã!
}

void internal_node_insert(Table* table, uint32_t parent_page_num, uint32_t key, uint32_t child_page_num) {
    void* parent_page = pager_get_page(table->pager, parent_page_num);
    uint32_t num_keys = *(uint32_t*)(parent_page + INTERNAL_NODE_NUM_KEYS_OFFSET);
    uint32_t right_child = *(uint32_t*)(parent_page + INTERNAL_NODE_RIGHT_CHILD_OFFSET);

    int left = 0;
    int right = num_keys;
    while (left < right) {
        int mid = left + (right - left) / 2;
        uint32_t key_at_mid = *(uint32_t*)(parent_page + INTERNAL_NODE_HEADER_SIZE + (mid * 8) + 4);
        if (key_at_mid > key) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }

    uint32_t index = left;

    if (index == num_keys) {
        void* cell_ptr = parent_page + INTERNAL_NODE_HEADER_SIZE + (num_keys * 8);
        *(uint32_t*)(cell_ptr) = right_child;
        *(uint32_t*)(cell_ptr + 4) = key;
        *(uint32_t*)(parent_page + INTERNAL_NODE_RIGHT_CHILD_OFFSET) = child_page_num;
    } else {
        void* cell_ptr = parent_page + INTERNAL_NODE_HEADER_SIZE + (index * 8);
        uint32_t bytes_to_shift = (num_keys - index) * 8;
        memmove(cell_ptr + 8, cell_ptr, bytes_to_shift);

        *(uint32_t*)(cell_ptr + 4) = key;
        *(uint32_t*)(cell_ptr + 8) = child_page_num;
    }

    num_keys++;
    *(uint32_t*)(parent_page + INTERNAL_NODE_NUM_KEYS_OFFSET) = num_keys;
    pager_flush(table->pager, parent_page_num);
}

void leaf_node_split_and_insert(Cursor* cursor, Row* row) {
    void* page = pager_get_page(cursor->table->pager, cursor->page_num);
    uint8_t is_root = *(uint8_t*)(page + IS_ROOT_OFFSET);

    void* left_page = NULL;
    uint32_t left_page_num = 0;
    void* right_page = NULL;
    uint32_t right_page_num = 0;

    if (is_root) {
        // Allocate left page first (Page 1)
        left_page_num = cursor->table->pager->num_pages;
        left_page = pager_alloc_page(cursor->table->pager);
        btree_init_leaf_node(left_page);

        // Allocate right page second (Page 2)
        right_page_num = cursor->table->pager->num_pages;
        right_page = pager_alloc_page(cursor->table->pager);
        btree_init_leaf_node(right_page);

        uint32_t num_cells = *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET);
        uint32_t mid_point = num_cells / 2;

        // copy the right-half to right_page
        void* src_ptr = page + LEAF_NODE_HEADER_SIZE + (mid_point * (4 + ROW_SIZE));
        void* dest_ptr = right_page + LEAF_NODE_HEADER_SIZE;
        uint32_t bytes_to_move = (num_cells - mid_point) * (4 + ROW_SIZE);
        memcpy(dest_ptr, src_ptr, bytes_to_move);

        // copy the left-half to left_page
        src_ptr = page + LEAF_NODE_HEADER_SIZE;
        dest_ptr = left_page + LEAF_NODE_HEADER_SIZE;
        uint32_t bytes_to_move_left = mid_point * (4 + ROW_SIZE);
        memcpy(dest_ptr, src_ptr, bytes_to_move_left);
        
        // Update num_cells of both pages
        *(uint32_t*)(right_page + LEAF_NODE_NUM_CELLS_OFFSET) = (num_cells - mid_point);
        *(uint32_t*)(left_page + LEAF_NODE_NUM_CELLS_OFFSET) = mid_point;

        // Link leaf nodes: left_page -> right_page
        *(uint32_t*)(left_page + LEAF_NODE_NEXT_LEAF_OFFSET) = right_page_num;
        *(uint32_t*)(right_page + LEAF_NODE_NEXT_LEAF_OFFSET) = 0;

        // Convert page (root) to an internal node
        btree_init_internal_node(page);
        *(uint8_t*)(page + IS_ROOT_OFFSET) = IS_ROOT_TRUE;
        *(uint32_t*)(page + INTERNAL_NODE_RIGHT_CHILD_OFFSET) = right_page_num;
        *(uint32_t*)(page + INTERNAL_NODE_NUM_KEYS_OFFSET) = 1;

        // Set left child and split key in cell 0 of internal node
        void* cell0 = page + INTERNAL_NODE_HEADER_SIZE;
        *(uint32_t*)(cell0) = left_page_num;
        uint32_t split_key = *(uint32_t*)(right_page + LEAF_NODE_HEADER_SIZE);
        *(uint32_t*)(cell0 + 4) = split_key;

    } else {
        left_page = page;
        left_page_num = cursor->page_num;

        right_page_num = cursor->table->pager->num_pages;
        right_page = pager_alloc_page(cursor->table->pager);
        btree_init_leaf_node(right_page);

        uint32_t num_cells = *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET);
        uint32_t mid_point = num_cells / 2;

        void* src_ptr = page + LEAF_NODE_HEADER_SIZE + (mid_point * (4 + ROW_SIZE));
        void* dest_ptr = right_page + LEAF_NODE_HEADER_SIZE;
        uint32_t bytes_to_move = (num_cells - mid_point) * (4 + ROW_SIZE);

        memcpy(dest_ptr, src_ptr, bytes_to_move);

        *(uint32_t*)(right_page + LEAF_NODE_NUM_CELLS_OFFSET) = (num_cells - mid_point);
        *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET) = mid_point;

        // Link leaf nodes: page -> right_page
        *(uint32_t*)(right_page + LEAF_NODE_NEXT_LEAF_OFFSET) = *(uint32_t*)(page + LEAF_NODE_NEXT_LEAF_OFFSET);
        *(uint32_t*)(page + LEAF_NODE_NEXT_LEAF_OFFSET) = right_page_num;

        // Insert split key and right_page_num into parent internal node
        uint32_t split_key = *(uint32_t*)(right_page + LEAF_NODE_HEADER_SIZE);
        internal_node_insert(cursor->table, cursor->parent_page_num, split_key, right_page_num);
    }

    // Use btree_find to locate the target leaf and cell_num for inserting row
    Cursor new_cursor;
    btree_find(cursor->table, row->id, &new_cursor);
    leaf_node_insert(&new_cursor, row);

    // flush pages
    pager_flush(cursor->table->pager, right_page_num);
    if (is_root) {
        pager_flush(cursor->table->pager, left_page_num);
    }
    pager_flush(cursor->table->pager, cursor->page_num);
    pager_flush(cursor->table->pager, new_cursor.page_num);
}

void btree_insert(Table* table, Row* row) {
    ensure_root_page(table);
    // Check if key already exists
    Cursor cursor;
    bool found = btree_find(table, row->id, &cursor);

    if (found) {
        printf("[ERROR:00601] Key %u already exists\n", row->id);
        return;
    }

    void *page = pager_get_page(table->pager, cursor.page_num);
    uint32_t num_cells = *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET);

    // If the leaf node is full, split it
    if (num_cells >= LEAF_NODE_MAX_CELLS) {
        leaf_node_split_and_insert(&cursor, row);
    } else {
        leaf_node_insert(&cursor, row);
    }
    pager_flush(table->pager, cursor.page_num);
}

uint32_t internal_node_find_child(void* page, uint32_t key){
    uint32_t num_keys = *(uint32_t*)(page + INTERNAL_NODE_NUM_KEYS_OFFSET);

    int left = 0;
    int right = num_keys;

    while (left < right) {
        uint32_t mid = left + (right - left) / 2;
        uint32_t key_at_mid = *(uint32_t*)(page + INTERNAL_NODE_HEADER_SIZE + (mid * 8) + 4);
        
        if (key_at_mid > key) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    if (left == num_keys) {
        return *(uint32_t*)(page + INTERNAL_NODE_RIGHT_CHILD_OFFSET);
    } else {
        return *(uint32_t*)(page + INTERNAL_NODE_HEADER_SIZE + (left * 8));
    }
}


bool btree_find(Table *table, int key, Cursor* cursor) {
    ensure_root_page(table);
    // Start with root page - always 0 for simplicity
    uint32_t page_num = table->root_page;
    uint32_t parent_page_num = table->root_page;
    void *page = pager_get_page(table->pager, page_num);

    // What type of node is the root page?
    uint8_t node_type = *(uint8_t*)(page + NODE_TYPE_OFFSET);

    // If internal node, find the child page
    while (node_type == INTERNAL_NODE_TYPE) {
        parent_page_num = page_num;
        page_num = internal_node_find_child(page, key);
        page = pager_get_page(table->pager, page_num);
        node_type = *(uint8_t*)(page + NODE_TYPE_OFFSET);
    }

    // Now we know the page is a leaf node and continue to binary search
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
    cursor->page_num = page_num;
    cursor->parent_page_num = parent_page_num;
    cursor->cell_num = left; // From your binary search loop
    cursor->is_eof = (left >= num_cells);

    if (left < num_cells) {
        uint32_t key_at_left = *(uint32_t*)(page + LEAF_NODE_HEADER_SIZE + (left * (4 + ROW_SIZE)));
        return (key_at_left == key);
    }
    return false;
}

void table_start(Table* table, Cursor* cursor) {
    ensure_root_page(table);
    cursor->table = table;

    uint32_t page_num = table->root_page;
    void* page = pager_get_page(table->pager, page_num);
    uint8_t node_type = *(uint8_t*)(page + NODE_TYPE_OFFSET);

    while (node_type == INTERNAL_NODE_TYPE) {
        page_num = *(uint32_t*)(page + INTERNAL_NODE_HEADER_SIZE);
        page = pager_get_page(table->pager, page_num);
        node_type = *(uint8_t*)(page + NODE_TYPE_OFFSET);
    }

    cursor->page_num = page_num;
    cursor->cell_num = 0;

    uint32_t num_cells = *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET);
    cursor->is_eof = (num_cells == 0);
}

void cursor_advance(Cursor* cursor) {
    void* page = pager_get_page(cursor->table->pager, cursor->page_num);
    uint32_t num_cells = *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET);

    cursor->cell_num += 1;
    if (cursor->cell_num >= num_cells) {
        uint32_t next_page_num = *(uint32_t*)(page + LEAF_NODE_NEXT_LEAF_OFFSET);
        if (next_page_num != 0) {
            cursor->page_num = next_page_num;
            cursor->cell_num = 0;
        } else {
            cursor->is_eof = true;
        }
    }
}

/* Helpers function to print and debug the tree */

void btree_dump(Table* table, uint32_t page_num) {
    ensure_root_page(table);
    if (page_num >= table->pager->num_pages) {
        printf("[ERROR:00601] Page %u out of bounds (allocated: %u)\n", page_num, table->pager->num_pages);
        return;
    }

    void* page = pager_get_page(table->pager, page_num);
    uint8_t node_type = *(uint8_t*)(page + NODE_TYPE_OFFSET);

    if (node_type == LEAF_NODE_TYPE) {
        uint32_t num_cells = *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET);
        printf("[BTREE] Page %u: type=LEAF num_cells=%u\n", page_num, num_cells);

        uint32_t cell_size = 4 + ROW_SIZE; // 64 bytes
        for (uint32_t i = 0; i < num_cells; i++) {
            uint32_t cell_offset = LEAF_NODE_HEADER_SIZE + (i * cell_size);
            uint32_t key = *(uint32_t*)(page + cell_offset);
            printf("[BTREE]   Cell %u: key=%u (%d bytes)\n", i, key, ROW_SIZE);
        }
    } else {
        uint32_t num_keys = *(uint32_t*)(page + INTERNAL_NODE_NUM_KEYS_OFFSET);
        uint32_t right_child = *(uint32_t*)(page + INTERNAL_NODE_RIGHT_CHILD_OFFSET);
        printf("[BTREE] Page %u: type=INTERNAL num_keys=%u right_child=%u\n", page_num, num_keys, right_child);

        for (uint32_t i = 0; i < num_keys; i++) {
            uint32_t cell_offset = INTERNAL_NODE_HEADER_SIZE + (i * 8);
            uint32_t child_page = *(uint32_t*)(page + cell_offset);
            uint32_t key = *(uint32_t*)(page + cell_offset + 4);
            printf("[BTREE]   Key %u: key=%u (child_page=%u)\n", i, key, child_page);
        }
    }
}

uint32_t get_tree_depth(Table* table) {
    uint32_t page_num = table->root_page;
    void* page = pager_get_page(table->pager, page_num);
    uint8_t node_type = *(uint8_t*)(page + NODE_TYPE_OFFSET);
    uint32_t depth = 1;

    while (node_type == INTERNAL_NODE_TYPE) {
        uint32_t num_keys = *(uint32_t*)(page + INTERNAL_NODE_NUM_KEYS_OFFSET);
        if (num_keys > 0) {
            page_num = *(uint32_t*)(page + INTERNAL_NODE_HEADER_SIZE);
        } else {
            page_num = *(uint32_t*)(page + INTERNAL_NODE_RIGHT_CHILD_OFFSET);
        }
        page = pager_get_page(table->pager, page_num);
        node_type = *(uint8_t*)(page + NODE_TYPE_OFFSET);
        depth++;
    }

    return depth;
}

void print_tree_node(Table* table, uint32_t page_num, uint32_t indent_level) {
    void* page = pager_get_page(table->pager, page_num);
    uint8_t node_type = *(uint8_t*)(page + NODE_TYPE_OFFSET);

    char indent[64] = "";
    for (uint32_t i = 0; i < indent_level; i++) {
        strcat(indent, "  ");
    }

    if (node_type == LEAF_NODE_TYPE) {
        uint32_t num_cells = *(uint32_t*)(page + LEAF_NODE_NUM_CELLS_OFFSET);
        printf("[BTREE] %sLEAF (page=%u cells=%u keys=[", indent, page_num, num_cells);
        
        uint32_t cell_size = 4 + ROW_SIZE;
        for (uint32_t i = 0; i < num_cells; i++) {
            uint32_t key = *(uint32_t*)(page + LEAF_NODE_HEADER_SIZE + (i * cell_size));
            printf("%u%s", key, (i < num_cells - 1) ? "," : "");
        }
        printf("])\n");
    } else {
        uint32_t num_keys = *(uint32_t*)(page + INTERNAL_NODE_NUM_KEYS_OFFSET);
        printf("[BTREE] %sINTERNAL (page=%u keys=[", indent, page_num);

        for (uint32_t i = 0; i < num_keys; i++) {
            uint32_t key = *(uint32_t*)(page + INTERNAL_NODE_HEADER_SIZE + (i * 8) + 4);
            printf("%u%s", key, (i < num_keys - 1) ? "," : "");
        }
        printf("])\n");

        for (uint32_t i = 0; i < num_keys; i++) {
            uint32_t child_page = *(uint32_t*)(page + INTERNAL_NODE_HEADER_SIZE + (i * 8));
            print_tree_node(table, child_page, indent_level + 1);
        }
        uint32_t right_child = *(uint32_t*)(page + INTERNAL_NODE_RIGHT_CHILD_OFFSET);
        print_tree_node(table, right_child, indent_level + 1);
    }
}

void btree_structure(Table* table) {
    ensure_root_page(table);
    printf("[BTREE] Tree depth: %u\n", get_tree_depth(table));
    print_tree_node(table, table->root_page, 0);
}