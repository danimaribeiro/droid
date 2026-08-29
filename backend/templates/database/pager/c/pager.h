#ifndef PAGER_H
#define PAGER_H

#include <stdint.h>
#include <stdbool.h>

#define PAGE_SIZE 4096
#define TABLE_MAX_PAGES 1000

/* TODO: Define the Pager and Frame structs
 *
 * The pager manages fixed-size pages in memory and on disk.
 * Each frame holds one page's data, its page number, and a dirty flag.
 */

typedef struct {
    // Define your pager structure
} Pager;

void *pager_get_page(Pager *pager, uint32_t page_num);
void *pager_alloc_page(Pager *pager);
void pager_status(Pager *pager);
void pager_flush(Pager *pager, uint32_t page_num);
void pager_close(Pager *pager);

#endif
