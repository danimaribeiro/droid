// btree.h
#ifndef BTREE_H
#define BTREE_H

#include "table.h"
#include "row.h"

void btree_insert(Table *table, int key, char *row_buffer);
void btree_select_all(Table *table);
Row* btree_find(Table *table, int key);

#endif