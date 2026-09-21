export function Field({ label, children, wide = false }) {
  return (
    <label
      className={`flex min-w-0 flex-col gap-2 text-sm font-semibold text-slate-700 [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-300 [&_input]:bg-white [&_input]:px-3.5 [&_input]:py-2.5 [&_input]:font-normal [&_input]:text-slate-900 [&_input]:shadow-sm [&_input]:transition [&_input]:placeholder:text-slate-400 focus-within:[&_input]:border-sky-500 focus-within:[&_input]:ring-2 focus-within:[&_input]:ring-sky-100 [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-3.5 [&_select]:py-2.5 [&_select]:font-normal [&_select]:text-slate-900 [&_textarea]:min-h-28 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:bg-white [&_textarea]:px-3.5 [&_textarea]:py-2.5 [&_textarea]:font-normal [&_textarea]:text-slate-900 ${wide ? 'md:col-span-2' : ''}`}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}
