import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  FiArrowRight,
  FiCalendar,
  FiMapPin,
  FiPhone,
  FiSearch,
  FiShield,
  FiUsers,
  FiActivity,
} from 'react-icons/fi';
import { useHospital } from '../state/context';
import { money, hospital, dateKey } from '../data/seed';
import { normalize, availableSlots } from '../data/domain';
import { Empty, PageTitle, Select } from '../components/UI';
import { BranchCard, DoctorCard, Photo, Rating } from '../components/Cards';

function SectionHeading({ eyebrow, title, to, children }) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {children}
      </div>
      {to && (
        <Link className="section-link" to={to}>
          Xem tất cả <FiArrowRight />
        </Link>
      )}
    </div>
  );
}

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
      <section className="home-hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow pill">
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
            <div className="home-search">
              <label htmlFor="care-search">Bạn đang cần tìm gì?</label>
              <div className="search-input">
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
                <div className="search-results" id="care-results" aria-live="polite">
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
            <div className="hero-hints">
              <span>
                <FiShield /> Thông tin rõ ràng
              </span>
              <span>
                <FiCalendar /> Chủ động chọn lịch
              </span>
            </div>
          </div>
          <div className="hero-photo-wrap">
            <Photo
              src="/images/hero.jpg"
              alt="Đội ngũ bác sĩ An Tâm — ảnh minh họa"
              className="hero-photo"
            />
            <div className="hero-photo-note">
              <span className="medical-icon">
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
      <div className="container service-shortcuts">
        {[
          ['/co-so', FiMapPin, 'Đặt khám tại cơ sở', 'Chọn nơi khám thuận tiện'],
          ['/bac-si', FiUsers, 'Đặt khám theo bác sĩ', 'Tìm bác sĩ phù hợp'],
          ['/chuyen-khoa', FiActivity, 'Khám theo chuyên khoa', 'Chăm sóc đúng nhu cầu'],
          ['/goi-kham', FiShield, 'Gói khám sức khỏe', 'Chủ động kiểm tra định kỳ'],
        ].map(([to, Icon, title, note]) => (
          <Link key={to} to={to}>
            <span className="shortcut-icon">
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
      <section className="container section">
        <SectionHeading
          eyebrow="GẦN BẠN, THUẬN TIỆN CHO BẠN"
          title="Hệ thống cơ sở An Tâm"
          to="/co-so"
        >
          <p>Cùng tiêu chuẩn chăm sóc, thêm lựa chọn gần nhà.</p>
        </SectionHeading>
        <div className="grid four">
          {branches.map((b) => (
            <BranchCard key={b.id} branch={b} />
          ))}
        </div>
      </section>
      <section className="pale section">
        <div className="container">
          <SectionHeading
            eyebrow="HIỂU CHUYÊN MÔN, CHỌN ĐÚNG BÁC SĨ"
            title="Đội ngũ bác sĩ"
            to="/bac-si"
          />
          <div className="grid four">
            {doctors.slice(0, 4).map((d) => (
              <DoctorCard key={d.id} doctor={d} />
            ))}
          </div>
        </div>
      </section>
      <section className="container section">
        <SectionHeading
          eyebrow="CHĂM SÓC THEO NHU CẦU"
          title="Bạn muốn khám chuyên khoa nào?"
          to="/chuyen-khoa"
        />
        <div className="specialty-grid">
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
      <section className="pale section">
        <div className="container">
          <SectionHeading
            eyebrow="DỄ DÀNG TỪ BƯỚC ĐẦU TIÊN"
            title="Đặt khám trong 4 bước"
            to="/huong-dan"
          />
          <div className="grid four guide-steps">
            {[
              'Chọn cơ sở và bác sĩ',
              'Chọn ngày, giờ phù hợp',
              'Kiểm tra thông tin người khám',
              'Xác nhận và theo dõi lịch',
            ].map((text, i) => (
              <div className="panel" key={text}>
                <span className="step-number">0{i + 1}</span>
                <h3>{text}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container section">
        <div className="cta">
          <div>
            <h2>Sẵn sàng cho lần khám tiếp theo?</h2>
            <p>Lịch hẹn và kết quả khám, được lưu trong cùng một không gian.</p>
          </div>
          <Link className="button white" to="/dat-lich">
            Đặt lịch khám <FiArrowRight />
          </Link>
        </div>
      </section>
    </>
  );
}

export function DirectoryPage({ kind }) {
  const { db } = useHospital();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const branchId = params.get('branchId') || '';
  const specialtyId = params.get('specialtyId') || '';
  const set = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };
  const names = {
    branches: 'Hệ thống cơ sở',
    doctors: 'Đội ngũ bác sĩ',
    specialties: 'Chuyên khoa',
    packages: 'Gói khám sức khỏe',
  };
  const rows = db[kind].filter(
    (r) =>
      r.active &&
      normalize(
        r.name +
          ' ' +
          (r.address || '') +
          ' ' +
          (db.specialties.find((s) => s.id === r.specialtyId)?.name || ''),
      ).includes(normalize(query)) &&
      (!r.branchId || db.branches.some((b) => b.id === r.branchId && b.active)) &&
      (!branchId ||
        r.branchId === branchId ||
        r.branchIds?.includes(branchId) ||
        (kind === 'specialties' &&
          db.departments.some(
            (d) => d.specialtyId === r.id && d.branchId === branchId && d.active,
          ))) &&
      (!specialtyId || r.specialtyId === specialtyId),
  );
  return (
    <div className="container page">
      <PageTitle
        title={names[kind]}
        description="Tìm hiểu thông tin, lựa chọn nơi khám và bác sĩ phù hợp với bạn."
      />
      <div className="filters">
        <label className="field">
          <span>Tìm kiếm</span>
          <input
            type="search"
            value={query}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Nhập tên, không cần dấu…"
          />
        </label>
        {kind !== 'branches' && (
          <Select
            label="Cơ sở"
            value={branchId}
            onChange={(v) => set('branchId', v)}
            options={db.branches.filter((b) => b.active)}
            placeholder="Tất cả cơ sở"
          />
        )}
        {['doctors', 'packages'].includes(kind) && (
          <Select
            label="Chuyên khoa"
            value={specialtyId}
            onChange={(v) => set('specialtyId', v)}
            options={db.specialties.filter((s) => s.active)}
            placeholder="Tất cả chuyên khoa"
          />
        )}
      </div>
      <p className="muted">{rows.length} kết quả phù hợp</p>
      <div className="grid three">
        {rows.map((r) =>
          kind === 'branches' ? (
            <BranchCard key={r.id} branch={r} />
          ) : kind === 'doctors' ? (
            <DoctorCard key={r.id} doctor={r} />
          ) : (
            <article className="panel" key={r.id}>
              <span className="medical-icon">
                <FiActivity />
              </span>
              <h2>{r.name}</h2>
              <p>{r.contents || 'Thăm khám và tư vấn cùng đội ngũ bác sĩ An Tâm.'}</p>
              {r.price && <h3>{money(r.price)}</h3>}
              <Link
                className="button light"
                to={kind === 'packages' ? '/goi-kham/' + r.slug : '/bac-si?specialtyId=' + r.id}
              >
                {kind === 'packages' ? 'Xem gói khám' : 'Tìm bác sĩ'} <FiArrowRight />
              </Link>
            </article>
          ),
        )}
      </div>
      {!rows.length && <Empty />}
    </div>
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
    <div className="container page">
      <nav className="breadcrumbs">
        <Link to="/">Trang chủ</Link>
        <span>/</span>
        <Link to={branch ? '/co-so' : doctor ? '/bac-si' : '/goi-kham'}>
          {branch ? 'Cơ sở' : doctor ? 'Bác sĩ' : 'Gói khám'}
        </Link>
        <span>/</span>
        <span>{row.name}</span>
      </nav>
      <div className={'detail-header ' + (doctor ? 'doctor-detail-header' : '')}>
        {(branch || doctor) && (
          <Photo
            src={row.image}
            fallback={doctor ? '/images/doctor-male.jpg' : '/images/hospital.jpg'}
            alt={'Ảnh minh họa ' + row.name}
            className="detail-photo"
          />
        )}
        <div>
          <span className="eyebrow">{doctor ? row.qualification : 'HỆ THỐNG Y TẾ AN TÂM'}</span>
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
      <div className="detail-grid">
        <section className="panel">
          <h2>{branch ? 'Thông tin cơ sở' : 'Thông tin chuyên môn'}</h2>
          {branch ? (
            <>
              <dl className="summary">
                <dt>Địa chỉ</dt>
                <dd>{row.address}</dd>
                <dt>Hotline</dt>
                <dd>
                  <a href={'tel:' + row.phone}>{row.phone}</a>
                </dd>
                <dt>Giờ làm việc</dt>
                <dd>{row.hours}</dd>
              </dl>
              <h3>Khoa / phòng</h3>
              <div className="chips">
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
              <dl className="summary">
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
                        <Link className="block-link" key={b.id} to={'/co-so/' + b.slug}>
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
                    <div className="schedule-list">
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
                    <p className="notice">
                      Bác sĩ chưa mở lịch mới. Vui lòng liên hệ cơ sở để được hỗ trợ.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </section>
        <aside className="panel booking-promo">
          <span className="medical-icon">
            <FiCalendar />
          </span>
          <h2>Chọn lịch khám phù hợp</h2>
          <p>Chủ động chọn ngày, giờ. Theo dõi lịch hẹn trong tài khoản của bạn.</p>
          <Link className="button full" to={bookingUrl}>
            Đặt lịch khám <FiArrowRight />
          </Link>
          <p className="contact-note">
            <FiPhone /> Hỗ trợ:{' '}
            {doctor ? row.contactPhone || facility.phone : branch ? row.phone : hospital.phone}
          </p>
        </aside>
      </div>
      {branch && (
        <>
          <div className="section-heading section-subtitle">
            <h2>Bác sĩ tại cơ sở</h2>
          </div>
          <div className="grid three">
            {db.doctors
              .filter((d) => d.branchId === row.id && d.active)
              .map((d) => (
                <DoctorCard key={d.id} doctor={d} />
              ))}
          </div>
          <h2 className="section-subtitle">Gói khám tại cơ sở</h2>
          <div className="grid three">
            {db.packages
              .filter((p) => p.active && p.branchIds.includes(row.id))
              .map((p) => (
                <Link className="panel" key={p.id} to={'/goi-kham/' + p.slug}>
                  <h3>{p.name}</h3>
                  <p>{p.contents}</p>
                  <strong>{money(p.price)}</strong>
                  <p>Xem chi tiết →</p>
                </Link>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

export function InformationPage({ mode }) {
  const { db } = useHospital();
  return (
    <div className="container page">
      <PageTitle
        title={
          {
            about: 'Về Bệnh viện Đa khoa An Tâm',
            guide: 'Hướng dẫn đặt lịch',
            contact: 'Kết nối với An Tâm',
          }[mode]
        }
      />
      <div className="panel prose">
        {mode === 'about' ? (
          <>
            <h2>Một bệnh viện, nhiều điểm chăm sóc</h2>
            <p>
              An Tâm kết nối đội ngũ bác sĩ tại bốn cơ sở, giúp bạn tìm hiểu chuyên môn và chủ động
              lựa chọn lịch khám.
            </p>
            <p>
              Thương hiệu, ảnh, hồ sơ, địa chỉ và thông tin y tế trong bản demo đều mang tính minh
              họa.
            </p>
          </>
        ) : mode === 'guide' ? (
          <>
            <h2>Đặt lịch trong vài bước</h2>
            <ol>
              <li>Chọn cơ sở thuận tiện, chuyên khoa hoặc gói khám và bác sĩ.</li>
              <li>Chọn ngày và khung giờ còn trống.</li>
              <li>Đăng nhập tài khoản bệnh nhân demo, kiểm tra thông tin người khám.</li>
              <li>Xác nhận yêu cầu và theo dõi trạng thái trong “Lịch hẹn”.</li>
            </ol>
            <p>
              Bác sĩ sẽ duyệt yêu cầu. Sau khi khám hoàn tất, kết quả xuất hiện trong “Lịch sử
              khám”.
            </p>
          </>
        ) : (
          <>
            <h2>{hospital.name}</h2>
            <p>
              <FiPhone /> {hospital.phone} · {hospital.email}
            </p>
            {db.branches
              .filter((b) => b.active)
              .map((b) => (
                <div key={b.id}>
                  <h3>
                    <Link to={'/co-so/' + b.slug}>{b.name}</Link>
                  </h3>
                  <p>{b.address}</p>
                  <p>
                    <a href={'tel:' + b.phone}>{b.phone}</a> · {b.hours}
                  </p>
                </div>
              ))}
          </>
        )}
        <Link className="button" to="/dat-lich">
          Chọn lịch khám <FiArrowRight />
        </Link>
      </div>
    </div>
  );
}
export function NotFound() {
  return (
    <div className="container page">
      <PageTitle title="Không tìm thấy trang" />
      <Empty text="Trang không tồn tại hoặc bạn không được phép xem nội dung này." />
      <Link className="button" to="/">
        Về trang chủ
      </Link>
    </div>
  );
}
