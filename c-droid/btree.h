// btree.h
#ifndef BTREE_H
#define BTREE_H

#include "table.h"
#include "row.h"

void btree_init_leaf_node(void* page);
void btree_insert(Table* table, Row* row);
void btree_dump(Table* table, uint32_t page_num);

void btree_insert_old(Table *table, int key, char *row_buffer);
void btree_select_all(Table *table);
Row* btree_find(Table *table, int key);

#endif