// pager.c

#include "pager.h"


void* pager_get_page(Pager* pager, uint32_t page_num) {

    if (page_num >= TABLE_MAX_PAGES) {
        printf("[ERROR:00201] Page number out of bounds\n");
        return NULL;
    }
    
    if (pager->pages[page_num] == NULL) {
        pager->pages[page_num] = malloc(PAGE_SIZE);
        if (pager->pages[page_num] == NULL) {
            printf("[ERROR:00203] Failed to allocate memory for page\n");
            return NULL;
        }

        if (page_num < pager->num_pages) {
            lseek(pager->file_descriptor, page_num * PAGE_SIZE, SEEK_SET);
            read(pager->file_descriptor, pager->pages[page_num], PAGE_SIZE);
        } else {
            pager->num_pages++;
            memset(pager->pages[page_num], 0, PAGE_SIZE);
        }
    }
    return pager->pages[page_num];
}

void pager_flush(Pager* pager, uint32_t page_num) {
    if(pager->pages[page_num] == NULL) {
        printf("[ERROR:00202] Page not found\n");
        return;
    }
    lseek(pager->file_descriptor, page_num * PAGE_SIZE, SEEK_SET);
    write(pager->file_descriptor, pager->pages[page_num], PAGE_SIZE);
}