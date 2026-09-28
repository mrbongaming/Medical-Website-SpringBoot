import { useEffect, useId, useRef } from 'react';

export function Modal({ title, children, close, wide = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      opener?.focus?.();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-hidden rounded-2xl border-0 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/60 open:flex open:flex-col ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-brand-900">
        <h2 id={titleId}>{title}</h2>
        <button
          className="inline-flex size-10 items-center justify-center rounded-full border-0 bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
          onClick={close}
          aria-label="Đóng"
        >
          ×
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
    </dialog>
  );
}
