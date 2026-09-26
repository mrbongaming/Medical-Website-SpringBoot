import { Link, useParams } from 'react-router-dom';
import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiGlobe,
  FiMail,
  FiMapPin,
  FiNavigation,
  FiPhone,
} from 'react-icons/fi';
import { useHospital } from '../state/context';
import { money, hospital, dateKey } from '../data/seed';
import { availableSlots } from '../data/domain';
import { DoctorCard } from '../components/DoctorCard';
import { Photo } from '../components/Photo';
import { Rating } from '../components/Rating';
import { NotFound } from './NotFound';

const detailListClass =
  'grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_minmax(0,1fr)] [&_dt]:text-slate-500 [&_dd]:m-0 [&_dd]:min-w-0 [&_dd]:break-words [&_dd]:font-semibold [&_dd]:text-slate-800';

function TagList({ items }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {(items || []).map((item) => (
        <li className="rounded-full bg-sky-50 px-3 py-1.5 text-sm text-sky-900" key={item}>
          {item}
        </li>
      ))}
    </ul>
  );
}

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
      <nav
        className="sticky top-16 z-20 mb-8 overflow-x-auto border-y border-slate-200 bg-white/95 backdrop-blur"
        aria-label="Nội dung trang"
      >
        <div className="flex min-w-max gap-1">
          <a
            className="px-4 py-3 text-sm font-semibold text-slate-600 hover:text-sky-700"
            href="#tong-quan"
          >
            Tổng quan
          </a>
          {branch && (
            <a
              className="px-4 py-3 text-sm font-semibold text-slate-600 hover:text-sky-700"
              href="#doi-ngu"
            >
              Đội ngũ
            </a>
          )}
          {branch && (
            <a
              className="px-4 py-3 text-sm font-semibold text-slate-600 hover:text-sky-700"
              href="#goi-kham"
            >
              Gói khám
            </a>
          )}
          <a
            className="px-4 py-3 text-sm font-semibold text-slate-600 hover:text-sky-700"
            href="#dat-lich"
          >
            Đặt lịch
          </a>
        </div>
      </nav>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section
          id="tong-quan"
          className="scroll-mt-36 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900"
        >
          <h2>{branch ? 'Thông tin cơ sở' : 'Thông tin chuyên môn'}</h2>
          {branch ? (
            <>
              <dl className={detailListClass}>
                <dt>Loại hình</dt>
                <dd>{row.facilityType || 'Cơ sở khám chữa bệnh'}</dd>
                <dt>Năm thành lập</dt>
                <dd>{row.establishedYear || 'Đang cập nhật'}</dd>
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
                <dt>Email</dt>
                <dd>
                  {row.email ? (
                    <a
                      className="inline-flex items-center gap-2 text-sky-700"
                      href={'mailto:' + row.email}
                    >
                      <FiMail className="shrink-0" /> {row.email}
                    </a>
                  ) : (
                    'Đang cập nhật'
                  )}
                </dd>
                <dt>Website</dt>
                <dd>
                  {row.website ? (
                    <a className="inline-flex items-center gap-2 text-sky-700" href={row.website}>
                      <FiGlobe className="shrink-0" /> {row.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    'Đang cập nhật'
                  )}
                </dd>
              </dl>
              {row.detailedIntroduction && (
                <p className="mt-6 leading-7 text-slate-700">{row.detailedIntroduction}</p>
              )}
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
              <h3 className="mt-7">Trang thiết bị và khu chức năng</h3>
              <TagList items={row.equipment} />
              <h3 className="mt-7">Tiện ích và hướng dẫn đi khám</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {(row.amenities || []).map((item) => (
                  <li
                    className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    key={item}
                  >
                    ✓ {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
                {row.visitGuide || 'Vui lòng đến trước giờ hẹn để hoàn tất thủ tục tiếp nhận.'}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <p className="m-0 flex gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                  <FiNavigation className="mt-1 shrink-0 text-sky-700" />
                  <span>
                    <strong className="block text-slate-900">Di chuyển và gửi xe</strong>
                    {row.transportGuide || 'Liên hệ cơ sở để được hướng dẫn di chuyển.'}
                  </span>
                </p>
                <p className="m-0 flex gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                  <FiCheckCircle className="mt-1 shrink-0 text-sky-700" />
                  <span>
                    <strong className="block text-slate-900">Hỗ trợ tiếp cận</strong>
                    {row.accessibility || 'Liên hệ cơ sở nếu cần hỗ trợ tiếp cận.'}
                  </span>
                </p>
              </div>
            </>
          ) : (
            <>
              <dl className={detailListClass}>
                <dt>Chuyên khoa</dt>
                <dd>{db.specialties.find((s) => s.id === row.specialtyId)?.name}</dd>
                {doctor && (
                  <>
                    <dt>Khoa / phòng</dt>
                    <dd>{db.departments.find((d) => d.id === row.departmentId)?.name}</dd>
                    <dt>Kinh nghiệm</dt>
                    <dd>{row.experience ?? 0} năm làm việc</dd>
                    <dt>Chức vụ hiện tại</dt>
                    <dd>{row.currentPosition || 'Bác sĩ điều trị'}</dd>
                    <dt>Chuyên môn</dt>
                    <dd>{row.expertise || 'Đang cập nhật'}</dd>
                    <dt>Đào tạo</dt>
                    <dd>{row.education || 'Đang cập nhật'}</dd>
                    <dt>Quá trình công tác</dt>
                    <dd>{row.career || 'Đang cập nhật'}</dd>
                    <dt>Thành tựu</dt>
                    <dd>{row.achievements || 'Đang cập nhật'}</dd>
                    <dt>Ngôn ngữ tư vấn</dt>
                    <dd>{row.consultationLanguages?.join(', ') || 'Tiếng Việt'}</dd>
                    <dt>Nhóm tuổi tiếp nhận</dt>
                    <dd>{row.patientGroups?.join(', ') || 'Đang cập nhật'}</dd>
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
                  <div className="mt-7 grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2">
                    <div>
                      <h3>Lĩnh vực khám chuyên sâu</h3>
                      <TagList items={row.focusAreas} />
                    </div>
                    <div>
                      <h3>Chứng chỉ chuyên môn</h3>
                      <TagList items={row.certifications} />
                    </div>
                    <div className="sm:col-span-2">
                      <h3>Hội viên chuyên ngành</h3>
                      <TagList items={row.memberships} />
                    </div>
                  </div>
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
              {!doctor && (
                <div className="mt-7 space-y-5 border-t border-slate-200 pt-6">
                  <div>
                    <h3>Đối tượng phù hợp</h3>
                    <p>{row.suitableFor}</p>
                  </div>
                  <div>
                    <h3>Chuẩn bị trước khi khám</h3>
                    <p>{row.preparation}</p>
                  </div>
                  <div>
                    <h3>Quy trình dự kiến</h3>
                    <ol className="space-y-2">
                      {(row.process || []).map((item, index) => (
                        <li className="rounded-lg bg-slate-50 p-3 text-sm" key={item}>
                          <strong>{index + 1}.</strong> {item}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <p>
                    <strong>Thời lượng dự kiến:</strong> {row.estimatedDuration}
                  </p>
                </div>
              )}
            </>
          )}
        </section>
        <aside
          id="dat-lich"
          className="scroll-mt-36 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:sticky lg:top-32 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900"
        >
          <span className="grid size-12 place-items-center rounded-xl bg-sky-100 text-2xl text-sky-700">
            <FiCalendar />
          </span>
          <h2>Chọn lịch khám phù hợp</h2>
          <p className="leading-6 text-slate-700">
            Chủ động chọn ngày, giờ. Theo dõi lịch hẹn trong tài khoản của bạn.
          </p>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 w-full"
            to={bookingUrl}
          >
            Đặt lịch khám <FiArrowRight />
          </Link>
          <p className="flex items-start gap-2 rounded-xl bg-sky-50 p-4 text-sm leading-6 text-sky-900">
            <FiPhone className="mt-1 shrink-0" />
            <span className="min-w-0 break-words">
              Hỗ trợ:{' '}
              {doctor ? row.contactPhone || facility.phone : branch ? row.phone : hospital.phone}
            </span>
          </p>
        </aside>
      </div>
      {branch && (
        <>
          <div
            id="doi-ngu"
            className="scroll-mt-36 mb-4 mt-10 flex flex-col justify-between gap-4 text-lg font-bold text-brand-900 sm:flex-row sm:items-end [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-brand-900 sm:[&_h2]:text-3xl"
          >
            <h2>Bác sĩ tại cơ sở</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {db.doctors
              .filter((d) => d.branchId === row.id && d.active)
              .map((d) => (
                <DoctorCard key={d.id} doctor={d} />
              ))}
          </div>
          <h2 id="goi-kham" className="scroll-mt-36 mb-4 mt-10 text-2xl font-bold text-brand-900">
            Gói khám tại cơ sở
          </h2>
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
