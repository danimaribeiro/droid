#ifndef ENGINE_H
#define ENGINE_H

#include "table.h"

void execute_sql(Table *table, char *command);

Table db_open(const char* filename);
void db_close(Table *table);

#endif
