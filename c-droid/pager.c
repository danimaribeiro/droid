// pager.c

#include "pager.h"


void* pager_get_page(Pager* pager, uint32_t page_num) {
    if (page_num >= TABLE_MAX_PAGES || page_num >= pager->num_pages) {
        printf("[ERROR:00201] Page number out of bounds\n");
        return NULL;
    }
    
    // Stage 9 - persistence
    if (pager->pages[page_num] == NULL) {
        pager->pages[page_num] = malloc(PAGE_SIZE);
        if (pager->pages[page_num] == NULL) {
            printf("[ERROR:00203] Failed to allocate memory for page\n");
            return NULL;
        }

        if (page_num < pager->num_pages) {
            lseek(pager->file_descriptor, page_num * PAGE_SIZE, SEEK_SET);
            read(pager->file_descriptor, pager->pages[page_num], PAGE_SIZE);
        }
    }

    return pager->pages[page_num];
}


void* pager_alloc_page(Pager* pager) {
    if (pager->num_pages >= TABLE_MAX_PAGES) {
        printf("[ERROR:00204] Max pages reached\n");
        return NULL;
    }

    uint32_t new_page = pager->num_pages;

    pager->pages[new_page] = malloc(PAGE_SIZE);
    if (pager->pages[new_page] == NULL) {
        printf("[ERROR:00203] Failed to allocate memory for page\n");
        return NULL;
    }
    memset(pager->pages[new_page], 0, PAGE_SIZE);

    pager->num_pages++;
    return pager->pages[new_page];
}

void pager_status(Pager* pager) {
    printf("[PAGER] Status: total_pages=%u cached=%d\n", pager->num_pages, pager->num_pages);
}


void pager_flush(Pager* pager, uint32_t page_num) {
    if(pager->pages[page_num] == NULL) {
        printf("[ERROR:00202] Page not found\n");
        return;
    }
    lseek(pager->file_descriptor, page_num * PAGE_SIZE, SEEK_SET);
    write(pager->file_descriptor, pager->pages[page_num], PAGE_SIZE);
}