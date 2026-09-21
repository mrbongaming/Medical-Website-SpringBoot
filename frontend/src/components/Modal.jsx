import { useEffect, useRef } from 'react';

export function Modal({ title, children, close, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`m-auto max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border-0 bg-white p-5 text-slate-800 shadow-2xl backdrop:bg-slate-950/60 sm:p-6 ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="sticky top-0 z-10 mb-5 flex items-center justify-between gap-4 border-b border-slate-200 bg-white pb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-brand-900">
        <h2>{title}</h2>
        <button
          className="inline-flex size-10 items-center justify-center rounded-full border-0 bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
          onClick={close}
          aria-label="Đóng"
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
