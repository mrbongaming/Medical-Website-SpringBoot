import { useState } from 'react';

export function usePagination(items, pageSize = 8, resetKey = '') {
  const [pageState, setPageState] = useState({ key: resetKey, page: 1 });
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = pageState.key === resetKey ? pageState.page : 1;
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  return {
    page: currentPage,
    pageCount,
    pageItems: items.slice(start, start + pageSize),
    setPage: (nextPage) => setPageState({ key: resetKey, page: nextPage }),
  };
}
