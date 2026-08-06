// pager.h

#ifndef PAGER_H
#define PAGER_H

#include <stdint.h>

#define PAGE_SIZE 4096
#define TABLE_MAX_PAGES 1000

typedef struct {
    uint32_t page_num;  // Qual página está aqui dentro? (ex: 999)
    void* data;         // O ponteiro para os 4096 bytes
    bool is_dirty;      // Foi alterada? (true = precisa de flush no disco)
} Frame;

typedef struct {
    int file_descriptor;  // O arquivo .db aberto no SO (retornado pelo open())
    uint32_t file_length; // Tamanho atual do arquivo em bytes no disco
    uint32_t num_pages;   // Quantidade total de páginas criadas
    
    // Cache LRU
    Frame frames[TABLE_MAX_PAGES];
    uint32_t next_victim;
} Pager;


// Pager step
void* pager_get_page(Pager* pager, uint32_t page_num);
void* pager_alloc_page(Pager* pager);
void pager_status(Pager* pager);

// Persistence step
void pager_flush(Pager* pager, uint32_t page_num);
void pager_close(Pager* pager);

#endif