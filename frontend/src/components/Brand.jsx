import { Link } from 'react-router-dom';

export function Brand({ inverse = false }) {
  return (
    <Link
      className={`inline-flex shrink-0 items-center gap-3 font-bold leading-tight tracking-wide [&_small]:block [&_small]:text-[10px] [&_small]:font-semibold [&_small]:tracking-[0.14em] ${inverse ? 'mx-4 mb-5 text-white [&_small]:text-sky-200' : 'text-brand-900 [&_small]:text-slate-500'}`}
      to="/"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-sky-600 text-2xl text-white shadow-sm">
        ✚
      </span>
      <span>
        AN TÂM<small>BỆNH VIỆN ĐA KHOA</small>
      </span>
    </Link>
  );
}
