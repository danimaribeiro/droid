// pager.h

#ifndef PAGER_H
#define PAGER_H

#include <stdint.h>

#define PAGE_SIZE 4096
#define TABLE_MAX_PAGES 100

typedef struct {
    int file_descriptor;  // O arquivo .db aberto no SO (retornado pelo open())
    uint32_t file_length; // Tamanho atual do arquivo em bytes no disco
    uint32_t num_pages;   // Quantidade total de páginas criadas
    void *pages[TABLE_MAX_PAGES];     // Array de ponteiros para o Cache de Páginas de 4KB na RAM
} Pager;


void* pager_get_page(Pager* pager, uint32_t page_num);
void pager_flush(Pager* pager, uint32_t page_num);

#endif