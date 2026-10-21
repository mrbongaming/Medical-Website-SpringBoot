import { FiCheckCircle, FiX, FiXCircle } from 'react-icons/fi';

export function ToastStack({ toasts, dismiss }) {
  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
      aria-label="Thông báo"
    >
      {toasts.map(({ id, type, message }) => (
        <div
          key={id}
          role={type === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-xl ${type === 'error' ? 'border-red-200 text-red-800' : 'border-emerald-200 text-emerald-800'}`}
        >
          {type === 'error' ? (
            <FiXCircle className="mt-0.5 shrink-0 text-xl" />
          ) : (
            <FiCheckCircle className="mt-0.5 shrink-0 text-xl" />
          )}
          <p className="min-w-0 flex-1 text-sm font-medium">{message}</p>
          <button
            type="button"
            className="rounded p-1 hover:bg-slate-100"
            aria-label="Đóng thông báo"
            onClick={() => dismiss(id)}
          >
            <FiX />
          </button>
        </div>
      ))}
    </div>
  );
}
