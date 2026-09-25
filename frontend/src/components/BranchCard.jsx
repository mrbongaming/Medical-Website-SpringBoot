import { Link } from 'react-router-dom';
import { FiArrowRight, FiClock, FiMapPin, FiPhone } from 'react-icons/fi';
import { Photo } from './Photo';

export function BranchCard({ branch }) {
  return (
    <article
      data-testid="branch-card"
      className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-sky-300"
    >
      <Link
        className="relative block overflow-hidden"
        to={'/co-so/' + branch.slug}
        aria-label={'Xem ' + branch.name}
      >
        <Photo
          src={branch.image}
          alt={'Ảnh minh họa ' + branch.name}
          className="h-52 w-full object-cover"
        />
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold tracking-wide text-brand-900 backdrop-blur">
          CƠ SỞ AN TÂM
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-brand-900 [&_p]:mb-2 [&_p]:text-sm [&_p]:text-slate-600">
        <h3>
          <Link to={'/co-so/' + branch.slug}>{branch.name}</Link>
        </h3>
        <p>
          <FiMapPin /> {branch.address}
        </p>
        <p>
          <FiClock /> {branch.hours}
        </p>
        <p>
          <FiPhone /> <a href={'tel:' + branch.phone}>{branch.phone}</a>
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 [&>a:first-child]:font-semibold [&>a:first-child]:text-sky-700">
          <Link to={'/co-so/' + branch.slug}>
            Xem chi tiết <FiArrowRight />
          </Link>
          <Link
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
            to={'/dat-lich?branchId=' + branch.id}
          >
            Đặt khám
          </Link>
        </div>
      </div>
    </article>
  );
}
