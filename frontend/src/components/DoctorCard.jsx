import { Link } from 'react-router-dom';
import { FiMapPin } from 'react-icons/fi';
import { useHospital } from '../state/context';
import { money } from '../data/seed';
import { Photo } from './Photo';
import { Rating } from './Rating';

export function DoctorCard({ doctor }) {
  const { db } = useHospital();
  return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-sky-300">
      <Link
        to={'/bac-si/' + doctor.slug}
        className="relative block overflow-hidden"
        aria-label={'Hồ sơ ' + doctor.name}
      >
        <Photo
          src={doctor.image}
          fallback="/images/doctor-male.jpg"
          alt={'Ảnh minh họa ' + doctor.name}
          className="h-64 w-full object-cover object-top"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-brand-900 [&_p]:mb-2 [&_p]:text-sm [&_p]:text-slate-600">
        <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
          {db.specialties.find((s) => s.id === doctor.specialtyId)?.name}
        </span>
        <h3>
          <Link to={'/bac-si/' + doctor.slug}>{doctor.name}</Link>
        </h3>
        <p className="font-medium text-brand-900">{doctor.qualification || 'Bác sĩ'}</p>
        <Rating doctorId={doctor.id} />
        <p>
          <FiMapPin /> {db.branches.find((b) => b.id === doctor.branchId)?.name}
        </p>
        <p>
          {doctor.experience ?? 0} năm kinh nghiệm · {money(doctor.price)}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 [&>a:first-child]:font-semibold [&>a:first-child]:text-sky-700">
          <Link to={'/bac-si/' + doctor.slug}>Hồ sơ bác sĩ</Link>
          <Link
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
            to={'/dat-lich?doctorId=' + doctor.id}
          >
            Đặt khám
          </Link>
        </div>
      </div>
    </article>
  );
}
