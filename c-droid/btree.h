// btree.h
#ifndef BTREE_H
#define BTREE_H

#include "table.h"
#include "row.h"

typedef struct {
    Table* table;
    uint32_t page_num;
    uint32_t cell_num;
    bool is_eof;
} Cursor;

void btree_init_leaf_node(void* page);
void btree_insert(Table* table, Row* row);
void btree_dump(Table* table, uint32_t page_num);

void btree_select_all(Table *table);
bool btree_find(Table *table, int key, Cursor* cursor);
void table_start(Table* table, Cursor* cursor);
void cursor_advance(Cursor* cursor);
void* cursor_value(Cursor* cursor);

#endif