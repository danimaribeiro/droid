// pager.c

#include "pager.h"


void* pager_get_page(Pager* pager, uint32_t page_num) {
    // Check if the page exists in the file
    if (page_num >= pager->num_pages) {
        printf("[ERROR:00201] Page number out of bounds\n");
        return NULL;
    }

    // return the page from the cache
    for(int i = 0; i < TABLE_MAX_PAGES; i++) {
        if (pager->frames[i].page_num == page_num) {
            return pager->frames[i].data;
        }
    }

    // Its not in the cache, load it from disk
    // first flush if dirty
    if(pager->frames[pager->next_victim].is_dirty) {
        pager_flush(pager, pager->frames[pager->next_victim].page_num);
    }

    lseek(pager->file_descriptor, page_num * PAGE_SIZE, SEEK_SET);
    read(pager->file_descriptor, pager->frames[pager->next_victim].data, PAGE_SIZE);
    
    uint32_t victim_index = pager->next_victim;
    pager->next_victim = (pager->next_victim + 1) % TABLE_MAX_PAGES;
    pager->frames[victim_index].page_num = page_num;
    pager->frames[victim_index].is_dirty = false;

    return pager->frames[victim_index].data;
}


void* pager_alloc_page(Pager* pager) {
    uint32_t new_page = pager->num_pages;
    pager->num_pages++;

    // Flush if dirty
    if(pager->frames[pager->next_victim].is_dirty) {
        pager_flush(pager, pager->frames[pager->next_victim].page_num);
    }

    uint32_t victim_index = pager->next_victim;
    pager->next_victim = (pager->next_victim + 1) % TABLE_MAX_PAGES;

    // Update the victim frame
    pager->frames[victim_index].page_num = new_page;
    pager->frames[victim_index].is_dirty = true;

    // Clear the page
    memset(pager->frames[victim_index].data, 0, PAGE_SIZE);

    return pager->frames[victim_index].data;
}

void pager_status(Pager* pager) {
    printf("[PAGER] Status: total_pages=%u cached=%d\n", pager->num_pages, pager->num_pages);
}


void pager_flush(Pager* pager, uint32_t page_num) {
    for(int i = 0; i < TABLE_MAX_PAGES; i++) {
        if (pager->frames[i].page_num == page_num) {
            lseek(pager->file_descriptor, page_num * PAGE_SIZE, SEEK_SET);
            write(pager->file_descriptor, pager->frames[i].data, PAGE_SIZE);
            pager->frames[i].is_dirty = false;
            return;
        }
    }
    printf("[ERROR:00202] Page not found\n");
}
void pager_close(Pager* pager) {
    for (int i = 0; i < TABLE_MAX_PAGES; i++) {
        if (pager->frames[i].is_dirty) {
            uint32_t page_num = pager->frames[i].page_num;
            lseek(pager->file_descriptor, page_num * PAGE_SIZE, SEEK_SET);
            write(pager->file_descriptor, pager->frames[i].data, PAGE_SIZE);
        }
        free(pager->frames[i].data);
    }
    
    fsync(pager->file_descriptor);
    close(pager->file_descriptor);
    free(pager);
}
