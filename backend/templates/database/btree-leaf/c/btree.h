#ifndef BTREE_H
#define BTREE_H

#include "table.h"
#include "row.h"

void btree_init_leaf_node(void *page);
void btree_insert(Table *table, Row *row);
void btree_dump(Table *table, uint32_t page_num);

#endif
