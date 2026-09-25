import { Link, useParams } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiMapPin, FiPhone } from 'react-icons/fi';
import { useHospital } from '../state/context';
import { money, hospital, dateKey } from '../data/seed';
import { availableSlots } from '../data/domain';
import { DoctorCard } from '../components/DoctorCard';
import { Photo } from '../components/Photo';
import { Rating } from '../components/Rating';
import { NotFound } from './NotFound';

export function DetailPage({ kind }) {
  const { db } = useHospital();
  const { slug } = useParams();
  const row = db[kind].find((r) => r.slug === slug && r.active);
  if (!row || (row.branchId && !db.branches.some((b) => b.id === row.branchId && b.active)))
    return <NotFound />;
  const branch = kind === 'branches';
  const doctor = kind === 'doctors';
  const facility = doctor ? db.branches.find((b) => b.id === row.branchId) : row;
  const bookingUrl =
    '/dat-lich?' + (branch ? 'branchId=' : doctor ? 'doctorId=' : 'packageId=') + row.id;
  const schedules = doctor
    ? db.schedules
        .filter(
          (s) =>
            s.doctorId === row.id &&
            s.date >= dateKey() &&
            availableSlots(db, row.id, s.date).some((t) => t.available),
        )
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5)
    : [];
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[55vh] py-10 sm:py-14">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500 [&_a]:text-sky-700">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        <Link to={branch ? '/co-so' : doctor ? '/bac-si' : '/goi-kham'}>
          {branch ? 'Cơ sở' : doctor ? 'Bác sĩ' : 'Gói khám'}
        </Link>
        <span>/</span>
        <span>{row.name}</span>
      </nav>
      <div
        className={`mb-8 grid items-start gap-6 rounded-3xl bg-white p-5 shadow-sm sm:p-7 ${doctor ? 'md:grid-cols-[16rem_minmax(0,1fr)]' : 'md:grid-cols-[22rem_minmax(0,1fr)]'}`}
      >
        {(branch || doctor) && (
          <Photo
            src={row.image}
            fallback={doctor ? '/images/doctor-male.jpg' : '/images/hospital.jpg'}
            alt={'Ảnh minh họa ' + row.name}
            className="w-full rounded-2xl object-cover shadow-md"
          />
        )}
        <div>
          <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
            {doctor ? row.qualification : 'HỆ THỐNG Y TẾ AN TÂM'}
          </span>
          <h1>{row.name}</h1>
          {doctor && <Rating doctorId={row.id} />}
          <p>{row.description || row.bio || row.contents}</p>
          {branch && (
            <p>
              <FiMapPin /> {row.address}
            </p>
          )}
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900">
          <h2>{branch ? 'Thông tin cơ sở' : 'Thông tin chuyên môn'}</h2>
          {branch ? (
            <>
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm [&_dt]:text-slate-500 [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-semibold [&_dd]:text-slate-800">
                <dt>Địa chỉ</dt>
                <dd>{row.address}</dd>
                <dt>Hotline</dt>
                <dd>
                  <a href={'tel:' + row.phone}>{row.phone}</a>
                </dd>
                <dt>Giờ làm việc</dt>
                <dd>{row.hours}</dd>
                <dt>Giờ tiếp nhận</dt>
                <dd>
                  {row.serviceHours?.open || '07:30'} – {row.serviceHours?.close || '17:00'}
                </dd>
                <dt>Cấp chuyên môn mô phỏng</dt>
                <dd>{row.careLevel === 'specialized' ? 'Cấp chuyên sâu' : 'Cấp cơ bản'}</dd>
                <dt>Hỗ trợ BHYT</dt>
                <dd>{row.insuranceContract ? 'Có · xác minh theo từng dịch vụ' : 'Chưa hỗ trợ'}</dd>
              </dl>
              <h3>Khoa / phòng</h3>
              <div className="flex flex-wrap gap-2 [&>span]:rounded-full [&>span]:bg-slate-100 [&>span]:px-3 [&>span]:py-1 [&>span]:text-sm [&>span]:text-slate-700">
                {db.departments
                  .filter((d) => d.branchId === row.id && d.active)
                  .map((d) => (
                    <Link
                      key={d.id}
                      to={'/bac-si?branchId=' + row.id + '&specialtyId=' + d.specialtyId}
                    >
                      {d.name}
                    </Link>
                  ))}
              </div>
            </>
          ) : (
            <>
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm [&_dt]:text-slate-500 [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-semibold [&_dd]:text-slate-800">
                <dt>Chuyên khoa</dt>
                <dd>{db.specialties.find((s) => s.id === row.specialtyId)?.name}</dd>
                {doctor && (
                  <>
                    <dt>Khoa / phòng</dt>
                    <dd>{db.departments.find((d) => d.id === row.departmentId)?.name}</dd>
                    <dt>Kinh nghiệm</dt>
                    <dd>{row.experience ?? 0} năm làm việc</dd>
                    <dt>Chuyên môn</dt>
                    <dd>{row.expertise || 'Đang cập nhật'}</dd>
                    <dt>Đào tạo</dt>
                    <dd>{row.education || 'Đang cập nhật'}</dd>
                    <dt>Quá trình công tác</dt>
                    <dd>{row.career || 'Đang cập nhật'}</dd>
                    <dt>Thành tựu</dt>
                    <dd>{row.achievements || 'Đang cập nhật'}</dd>
                  </>
                )}
                <dt>Cơ sở</dt>
                <dd>
                  {doctor ? (
                    <Link to={'/co-so/' + facility.slug}>{facility.name}</Link>
                  ) : (
                    db.branches
                      .filter((b) => row.branchIds.includes(b.id) && b.active)
                      .map((b) => (
                        <Link
                          className="block rounded-xl border border-slate-200 p-4 transition hover:border-sky-300 hover:bg-sky-50"
                          key={b.id}
                          to={'/co-so/' + b.slug}
                        >
                          {b.name}
                        </Link>
                      ))
                  )}
                </dd>
                {doctor && (
                  <>
                    <dt>Địa chỉ khám</dt>
                    <dd>{facility.address}</dd>
                    <dt>Liên hệ đặt khám</dt>
                    <dd>
                      <a href={'tel:' + (row.contactPhone || facility.phone)}>
                        {row.contactPhone || facility.phone}
                      </a>
                    </dd>
                  </>
                )}
                <dt>Phí khám</dt>
                <dd>
                  <strong>{money(row.price)}</strong>
                </dd>
              </dl>
              {doctor && (
                <>
                  <h3>Lịch khám gần nhất</h3>
                  {schedules.length ? (
                    <div className="space-y-3 [&>a]:flex [&>a]:items-center [&>a]:justify-between [&>a]:gap-4 [&>a]:rounded-xl [&>a]:border [&>a]:border-slate-200 [&>a]:p-4 [&>a]:transition hover:[&>a]:border-sky-300 hover:[&>a]:bg-sky-50">
                      {schedules.map((s) => (
                        <Link key={s.id} to={bookingUrl + '&date=' + s.date}>
                          <FiCalendar />
                          <span>
                            {new Date(s.date + 'T12:00:00').toLocaleDateString('vi-VN')}
                            <small>
                              {availableSlots(db, row.id, s.date).filter((t) => t.available).length}{' '}
                              khung giờ còn trống
                            </small>
                          </span>
                          <FiArrowRight />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      Bác sĩ chưa mở lịch mới. Vui lòng liên hệ cơ sở để được hỗ trợ.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </section>
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900">
          <span className="grid size-12 place-items-center rounded-xl bg-sky-100 text-2xl text-sky-700">
            <FiCalendar />
          </span>
          <h2>Chọn lịch khám phù hợp</h2>
          <p>Chủ động chọn ngày, giờ. Theo dõi lịch hẹn trong tài khoản của bạn.</p>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 w-full"
            to={bookingUrl}
          >
            Đặt lịch khám <FiArrowRight />
          </Link>
          <p className="rounded-xl bg-sky-50 p-4 text-sm text-sky-900">
            <FiPhone /> Hỗ trợ:{' '}
            {doctor ? row.contactPhone || facility.phone : branch ? row.phone : hospital.phone}
          </p>
        </aside>
      </div>
      {branch && (
        <>
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-brand-900 sm:[&_h2]:text-3xl [&_p]:mt-2 [&_p]:max-w-2xl [&_p]:text-slate-600 mb-4 text-lg font-bold text-brand-900">
            <h2>Bác sĩ tại cơ sở</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {db.doctors
              .filter((d) => d.branchId === row.id && d.active)
              .map((d) => (
                <DoctorCard key={d.id} doctor={d} />
              ))}
          </div>
          <h2 className="mb-4 text-lg font-bold text-brand-900">Gói khám tại cơ sở</h2>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {db.packages
              .filter((p) => p.active && p.branchIds.includes(row.id))
              .map((p) => (
                <Link
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900"
                  key={p.id}
                  to={'/dat-lich?branchId=' + row.id + '&packageId=' + p.id}
                >
                  <h3>{p.name}</h3>
                  <p>{p.contents}</p>
                  <strong>{money(p.price)}</strong>
                  <p>Đặt tại {row.name} →</p>
                </Link>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
