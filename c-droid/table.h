
#ifndef TABLE_H
#define TABLE_H

#include "pager.h"

typedef struct {
    char *name;           // Nome da tabela (ex: "users")
    Pager *pager;         // Ponteiro para o Gerenciador de Páginas/Cache da tabela
    uint32_t root_page;   // Número da página Raiz da B-Tree (ex: Página 0)
} Table;

#endif