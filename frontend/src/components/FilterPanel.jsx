import { useId, useState } from 'react';

export function FilterPanel({ children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="mb-5">
      <button
        type="button"
        data-testid="filter-toggle"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 border border-sky-200 bg-white text-sky-700 shadow-none hover:border-sky-300 hover:bg-sky-50 mb-3 w-full sm:w-auto lg:hidden"
        aria-controls={id}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? 'Thu gọn bộ lọc' : 'Tìm kiếm & lọc kết quả'}{' '}
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      <div
        id={id}
        data-testid="collapsible-filters"
        className={`${open ? 'grid' : 'hidden'} gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid lg:grid-cols-4`}
      >
        {children}
      </div>
    </div>
  );
}
