import { Children, Fragment, isValidElement, useMemo, useState } from 'react';
import { Empty } from './Empty';
import { Pagination } from './Pagination';

function flattenRows(children) {
  return Children.toArray(children).flatMap((child) =>
    isValidElement(child) && child.type === Fragment ? flattenRows(child.props.children) : [child],
  );
}

export function Table({
  headers,
  children,
  empty = false,
  pageSize: initialPageSize = 10,
  paginationKey = '',
}) {
  const rows = useMemo(() => flattenRows(children), [children]);
  const [pageState, setPageState] = useState({ key: paginationKey, page: 1 });
  const [pageSize, setPageSize] = useState(initialPageSize);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = pageState.key === paginationKey ? pageState.page : 1;
  const currentPage = Math.min(page, pageCount);
  const setPage = (nextPage) => setPageState({ key: paginationKey, page: nextPage });
  if (empty) return <Empty />;
  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto" tabIndex="0" aria-label="Bảng dữ liệu, có thể cuộn ngang">
        <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              {headers.map((h) => (
                <th className="px-5 py-3 font-semibold" scope="col" key={h}>
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
      <Pagination
        page={currentPage}
        pageCount={pageCount}
        total={rows.length}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={(nextSize) => {
          setPageSize(nextSize);
          setPage(1);
        }}
      />
    </section>
  );
}
