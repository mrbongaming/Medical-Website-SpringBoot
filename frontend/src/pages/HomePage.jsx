import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiCalendar,
  FiMapPin,
  FiSearch,
  FiShield,
  FiUsers,
  FiActivity,
} from 'react-icons/fi';
import { useHospital } from '../state/context';
import { normalize } from '../data/domain';
import { BranchCard } from '../components/BranchCard';
import { DoctorCard } from '../components/DoctorCard';
import { Photo } from '../components/Photo';
import { SectionHeading } from './SectionHeading';

export function HomePage() {
  const { db } = useHospital();
  const [query, setQuery] = useState('');
  const branches = db.branches.filter((b) => b.active);
  const doctors = db.doctors.filter((d) => d.active && branches.some((b) => b.id === d.branchId));
  const search = normalize(query.trim());
  const results = search
    ? [
        ...branches
          .filter((b) => normalize(b.name + ' ' + b.address).includes(search))
          .map((b) => ({ id: b.id, name: b.name, label: 'Cơ sở', to: '/co-so/' + b.slug })),
        ...doctors
          .filter((d) =>
            normalize(
              d.name + ' ' + db.specialties.find((s) => s.id === d.specialtyId)?.name,
            ).includes(search),
          )
          .map((d) => ({ id: d.id, name: d.name, label: 'Bác sĩ', to: '/bac-si/' + d.slug })),
        ...db.specialties
          .filter((s) => s.active && normalize(s.name).includes(search))
          .map((s) => ({
            id: s.id,
            name: s.name,
            label: 'Chuyên khoa',
            to: '/bac-si?specialtyId=' + s.id,
          })),
      ].slice(0, 8)
    : [];
  return (
    <>
      <section className="overflow-hidden bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 grid items-center gap-10 lg:grid-cols-2">
          <div className="[&_h1]:text-4xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-brand-900 sm:[&_h1]:text-5xl lg:[&_h1]:text-6xl [&_em]:not-italic [&_em]:text-sky-600 [&>p]:mt-5 [&>p]:max-w-xl [&>p]:text-lg [&>p]:text-slate-600">
            <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.16em] text-sky-700 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-800">
              <FiShield /> CHĂM SÓC TẬN TÂM, KẾT NỐI DỄ DÀNG
            </span>
            <h1>
              Đặt lịch hôm nay.
              <br />
              <em>An tâm mỗi ngày.</em>
            </h1>
            <p>
              Tìm cơ sở gần bạn, chọn bác sĩ phù hợp và chủ động chăm sóc sức khỏe cho chính mình.
            </p>
            <div className="relative mt-7">
              <label htmlFor="care-search">Bạn đang cần tìm gì?</label>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-lg focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100 [&_svg]:text-sky-600 [&_input]:min-h-14 [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:outline-none">
                <FiSearch />
                <input
                  id="care-search"
                  type="search"
                  placeholder="Cơ sở, bác sĩ, chuyên khoa…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-controls="care-results"
                  autoComplete="off"
                />
              </div>
              {search && (
                <div
                  className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl [&_a]:block [&_a]:rounded-xl [&_a]:p-3 hover:[&_a]:bg-sky-50 [&_small]:text-slate-500"
                  id="care-results"
                  aria-live="polite"
                >
                  {results.length ? (
                    results.map((r) => (
                      <Link key={r.id} to={r.to}>
                        <span>
                          {r.name}
                          <small>{r.label}</small>
                        </span>
                        <FiArrowRight />
                      </Link>
                    ))
                  ) : (
                    <p>Không tìm thấy. Thử tên khác hoặc bỏ bớt từ khóa.</p>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
              <span>
                <FiShield /> Thông tin rõ ràng
              </span>
              <span>
                <FiCalendar /> Chủ động chọn lịch
              </span>
            </div>
          </div>
          <div className="relative">
            <Photo
              src="/images/hero.jpg"
              alt="Đội ngũ bác sĩ An Tâm — ảnh minh họa"
              className="h-[28rem] w-full rounded-3xl object-cover shadow-2xl"
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur [&_strong]:block [&_strong]:text-brand-900 [&_span]:text-sm [&_span]:text-slate-500">
              <span className="grid size-12 place-items-center rounded-xl bg-sky-100 text-2xl text-sky-700">
                <FiActivity />
              </span>
              <div>
                <strong>Đồng hành cùng sức khỏe của bạn</strong>
                <span>
                  {branches.length} cơ sở · {doctors.length} bác sĩ trong hệ thống
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 [&>a]:flex [&>a]:items-center [&>a]:gap-3 [&>a]:rounded-2xl [&>a]:border [&>a]:border-slate-200 [&>a]:bg-white [&>a]:p-4 [&>a]:shadow-sm [&>a]:transition hover:[&>a]:border-sky-300 hover:[&>a]:shadow-md [&_strong]:block [&_strong]:text-brand-900 [&_small]:text-slate-500">
        {[
          ['/co-so', FiMapPin, 'Đặt khám tại cơ sở', 'Chọn nơi khám thuận tiện'],
          ['/bac-si', FiUsers, 'Đặt khám theo bác sĩ', 'Tìm bác sĩ phù hợp'],
          ['/chuyen-khoa', FiActivity, 'Khám theo chuyên khoa', 'Chăm sóc đúng nhu cầu'],
          ['/goi-kham', FiShield, 'Gói khám sức khỏe', 'Chủ động kiểm tra định kỳ'],
        ].map(([to, Icon, title, note]) => (
          <Link key={to} to={to}>
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-sky-100 text-2xl text-sky-700">
              <Icon />
            </span>
            <span>
              <strong>{title}</strong>
              <small>{note}</small>
            </span>
            <FiArrowRight />
          </Link>
        ))}
      </div>
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <SectionHeading
          eyebrow="GẦN BẠN, THUẬN TIỆN CHO BẠN"
          title="Hệ thống cơ sở An Tâm"
          to="/co-so"
        >
          <p>Cùng tiêu chuẩn chăm sóc, thêm lựa chọn gần nhà.</p>
        </SectionHeading>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {branches.map((b) => (
            <BranchCard key={b.id} branch={b} />
          ))}
        </div>
      </section>
      <section className="bg-slate-100 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="HIỂU CHUYÊN MÔN, CHỌN ĐÚNG BÁC SĨ"
            title="Đội ngũ bác sĩ"
            to="/bac-si"
          />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {doctors.slice(0, 4).map((d) => (
              <DoctorCard key={d.id} doctor={d} />
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <SectionHeading
          eyebrow="CHĂM SÓC THEO NHU CẦU"
          title="Bạn muốn khám chuyên khoa nào?"
          to="/chuyen-khoa"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>a]:flex [&>a]:items-center [&>a]:gap-4 [&>a]:rounded-2xl [&>a]:border [&>a]:border-slate-200 [&>a]:bg-white [&>a]:p-5 [&>a]:font-semibold [&>a]:text-brand-900 [&>a]:shadow-sm [&>a]:transition hover:[&>a]:border-sky-300 hover:[&>a]:shadow-md">
          {db.specialties
            .filter((s) => s.active)
            .map((s) => (
              <Link key={s.id} to={'/bac-si?specialtyId=' + s.id}>
                <span>
                  <FiActivity />
                </span>
                <strong>{s.name}</strong>
                <FiArrowRight />
              </Link>
            ))}
        </div>
      </section>
      <section className="bg-slate-100 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="DỄ DÀNG TỪ BƯỚC ĐẦU TIÊN"
            title="Đặt khám trong 4 bước"
            to="/huong-dan"
          />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 space-y-4">
            {[
              'Chọn cơ sở và bác sĩ',
              'Chọn ngày, giờ phù hợp',
              'Kiểm tra thông tin người khám',
              'Xác nhận và theo dõi lịch',
            ].map((text, i) => (
              <div
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900"
                key={text}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-600 font-bold text-white">
                  0{i + 1}
                </span>
                <h3>{text}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-slate-900 p-6 text-white sm:p-8 lg:flex-row lg:items-center [&_h2]:text-2xl [&_h2]:font-bold sm:[&_h2]:text-3xl [&_p]:mt-2 [&_p]:max-w-2xl [&_p]:text-slate-300">
          <div>
            <h2>Sẵn sàng cho lần khám tiếp theo?</h2>
            <p>Lịch hẹn và kết quả khám, được lưu trong cùng một không gian.</p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            to="/dat-lich"
          >
            Đặt lịch khám <FiArrowRight />
          </Link>
        </div>
      </section>
    </>
  );
}
