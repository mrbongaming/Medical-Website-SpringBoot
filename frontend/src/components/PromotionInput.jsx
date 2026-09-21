import { useState } from 'react';
import { Field } from './Field';

export function PromotionInput({ code, onApply, quote }) {
  const [text, setText] = useState(code || '');
  return (
    <div className="space-y-3">
      <Field label="Mã khuyến mãi">
        <div className="flex flex-col gap-2 sm:flex-row [&_input]:flex-1">
          <input
            value={text}
            onChange={(e) => setText(e.target.value.toUpperCase())}
            placeholder="Ví dụ: ANTAM50"
            maxLength={30}
          />
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 border border-sky-200 bg-white text-sky-700 shadow-none hover:border-sky-300 hover:bg-sky-50"
            onClick={() => onApply(text.trim().toUpperCase())}
          >
            Áp dụng
          </button>
        </div>
      </Field>
      {code && (
        <button
          className="border-0 bg-transparent p-0 text-sm font-semibold text-sky-700 hover:text-sky-900"
          type="button"
          onClick={() => {
            setText('');
            onApply('');
          }}
        >
          Bỏ mã {code}
        </button>
      )}
      <div aria-live="polite">
        {quote.error ? (
          <p
            className="my-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800"
            role="alert"
          >
            {quote.error}
          </p>
        ) : (
          <p className="text-slate-500">
            {quote.promotion
              ? `Đang áp dụng: ${quote.promotion.name}. `
              : 'Chưa có ưu đãi phù hợp. '}
            {quote.message || 'Tối đa một chương trình mỗi lần khám.'}
          </p>
        )}
      </div>
    </div>
  );
}
