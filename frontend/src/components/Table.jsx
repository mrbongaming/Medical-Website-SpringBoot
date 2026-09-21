import { Empty } from './Empty';

export function Table({ headers, children, empty = false }) {
  return empty ? (
    <Empty />
  ) : (
    <div
      className="w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm [&_table]:w-full [&_table]:min-w-[44rem] [&_table]:border-collapse [&_th]:bg-slate-50 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-slate-500 [&_td]:border-t [&_td]:border-slate-100 [&_td]:px-4 [&_td]:py-4 [&_td]:align-top [&_tbody_tr]:transition hover:[&_tbody_tr]:bg-sky-50/50"
      tabIndex="0"
      aria-label="Bảng dữ liệu, có thể cuộn ngang"
    >
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
