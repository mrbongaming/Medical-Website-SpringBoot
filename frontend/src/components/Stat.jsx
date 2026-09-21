export function Stat({ label, value, note }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm [&>span]:block [&>span]:text-sm [&>span]:font-medium [&>span]:text-slate-500 [&>strong]:mt-2 [&>strong]:block [&>strong]:text-3xl [&>strong]:font-bold [&>strong]:text-brand-900 [&>small]:mt-2 [&>small]:block [&>small]:text-slate-500">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}
