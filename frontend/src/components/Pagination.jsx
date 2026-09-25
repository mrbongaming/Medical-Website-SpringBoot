import { Button } from './Button';

export function Pagination({ page, pageCount, total, onPage }) {
  if (pageCount <= 1) return null;
  return (
    <nav
      className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
      aria-label="Phân trang"
    >
      <span className="text-slate-600">
        Trang {page}/{pageCount} · {total} kết quả
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Trước
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Sau
        </Button>
      </div>
    </nav>
  );
}
