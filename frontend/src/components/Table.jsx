import { Children, useState } from 'react';
import { Empty } from './Empty';
import { Pagination } from './Pagination';

export function Table({ headers, children, empty = false, pageSize = 15 }) {
  const rows = Children.toArray(children);
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  if (empty) return <Empty />;
  return (
    <section className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto" tabIndex="0" aria-label="Bảng dữ liệu, có thể cuộn ngang">
        <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              {headers.map((h) => (
                <th className="px-5 py-3 font-semibold" key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 [&_td]:px-5 [&_td]:py-4 [&_td]:align-top [&_tr]:transition hover:[&_tr]:bg-slate-50">
            {rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
          </tbody>
        </table>
      </div>
      <Pagination page={currentPage} pageCount={pageCount} total={rows.length} onPage={setPage} />
    </section>
  );
}
