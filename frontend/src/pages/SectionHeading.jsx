import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

export function SectionHeading({ eyebrow, title, to, children }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-brand-900 sm:[&_h2]:text-3xl [&_p]:mt-2 [&_p]:max-w-2xl [&_p]:text-slate-600">
      <div>
        <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
          {eyebrow}
        </span>
        <h2>{title}</h2>
        {children}
      </div>
      {to && (
        <Link
          className="inline-flex items-center gap-2 font-semibold text-sky-700 hover:text-sky-900"
          to={to}
        >
          Xem tất cả <FiArrowRight />
        </Link>
      )}
    </div>
  );
}
