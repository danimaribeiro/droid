#include "pager.h"

/* TODO: Implement the page manager (buffer pool)
 *
 * The pager manages fixed-size (4096 byte) pages in memory and on disk.
 *
 * pager_alloc_page(): allocate a new page, return pointer to its data
 * pager_get_page():   fetch an existing page (from cache or disk)
 * pager_status():     print pager state
 * pager_flush():      write a dirty page to disk
 * pager_close():      flush all pages and close the file
 *
 * Expected output:
 *   [PAGER] Alloc: page N
 *   [PAGER] Get page N: CACHE_HIT
 *   [PAGER] Status: total_pages=N
 */

void *pager_alloc_page(Pager *pager) {
    // TODO
}

void *pager_get_page(Pager *pager, uint32_t page_num) {
    // TODO
}

void pager_status(Pager *pager) {
    // TODO
}

void pager_flush(Pager *pager, uint32_t page_num) {
    // TODO
}

void pager_close(Pager *pager) {
    // TODO
}
