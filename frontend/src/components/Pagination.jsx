import { Button } from './Button';

function pageNumbers(page, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const values = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...values]
    .filter((value) => value > 0 && value <= pageCount)
    .sort((a, b) => a - b);
  return sorted.flatMap((value, index) =>
    index && value - sorted[index - 1] > 1 ? ['gap-' + value, value] : [value],
  );
}

export function Pagination({ page, pageCount, total, pageSize = 10, onPage, onPageSize }) {
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total);
  return (
    <nav
      className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm lg:flex-row lg:items-center lg:justify-between lg:px-5"
      aria-label="Phân trang"
    >
      <div className="flex flex-wrap items-center gap-3 text-slate-600">
        <span>
          Hiển thị {from}–{to} / {total} kết quả
        </span>
        {onPageSize && (
          <label className="flex items-center gap-2">
            <span>Số dòng</span>
            <select
              className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-slate-800"
              value={pageSize}
              onChange={(event) => onPageSize(Number(event.target.value))}
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Trước
        </Button>
        {pageNumbers(page, pageCount).map((value) =>
          typeof value === 'string' ? (
            <span className="px-1 text-slate-400" aria-hidden="true" key={value}>
              …
            </span>
          ) : (
            <button
              type="button"
              className={`grid min-h-9 min-w-9 place-items-center rounded-lg border px-2 font-semibold ${value === page ? 'border-sky-700 bg-sky-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-sky-400 hover:text-sky-700'}`}
              aria-current={value === page ? 'page' : undefined}
              onClick={() => onPage(value)}
              key={value}
            >
              {value}
            </button>
          ),
        )}
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
