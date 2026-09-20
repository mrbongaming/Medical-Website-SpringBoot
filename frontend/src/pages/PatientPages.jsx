import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useHospital } from '../state/context';
import { roles, money, dateKey } from '../data/seed';
import { availableSlots } from '../data/domain';
import { initialBooking } from '../data/booking';
import { Photo } from '../components/Cards';
import { Alert, Field, PageTitle, Select } from '../components/UI';

export function AuthPage() {
  const { db, login, dispatch } = useHospital();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [register, setRegister] = useState(false);
  const [role, setRole] = useState('patient');
  const [id, setId] = useState('');
  const [error, setError] = useState('');
  function enter(accountId) {
    login(accountId);
    const account = db.users.find((u) => u.id === accountId);
    const target = params.get('next');
    navigate(
      target?.startsWith('/') && !target.startsWith('//')
        ? target
        : account?.role === 'doctor'
          ? '/bac-si-lam-viec'
          : ['superAdmin', 'branchAdmin'].includes(account?.role)
            ? '/quan-tri'
            : '/lich-hen',
    );
  }
  function submit(e) {
    e.preventDefault();
    try {
      setError('');
      if (register) {
        const f = Object.fromEntries(new FormData(e.currentTarget));
        const accountId = dispatch('register', f);
        enter(accountId);
      } else enter(id);
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <div className="container page auth-grid">
      <div className="auth-story">
        <span className="eyebrow">CHÀO MỪNG ĐẾN AN TÂM</span>
        <h1>
          Sức khỏe của bạn.
          <br />
          Sự tận tâm của chúng tôi.
        </h1>
        <p>Một không gian kết nối bệnh nhân, bác sĩ và đội ngũ quản lý tại mọi cơ sở.</p>
        <div className="auth-symbol">✚</div>
        <p>
          Đây là phiên demo: chọn tài khoản để trải nghiệm vai trò, không nhập hay lưu mật khẩu.
        </p>
      </div>
      <section className="panel">
        <div className="tabs">
          <button
            className={!register ? 'selected' : ''}
            onClick={() => {
              setRegister(false);
              setError('');
            }}
          >
            Đăng nhập demo
          </button>
          <button
            className={register ? 'selected' : ''}
            onClick={() => {
              setRegister(true);
              setError('');
            }}
          >
            Tạo hồ sơ bệnh nhân
          </button>
        </div>
        <h2>{register ? 'Hồ sơ mới' : 'Chọn không gian của bạn'}</h2>
        <form onSubmit={submit}>
          {register ? (
            <>
              <Field label="Họ và tên">
                <input name="name" required />
              </Field>
              <Field label="Số điện thoại">
                <input
                  name="phone"
                  type="tel"
                  pattern="0[0-9]{9}"
                  title="10 số bắt đầu bằng 0"
                  required
                />
              </Field>
            </>
          ) : (
            <>
              <Select
                label="Vai trò"
                value={role}
                onChange={(v) => {
                  setRole(v);
                  setId('');
                }}
                options={Object.entries(roles).map(([id, name]) => ({ id, name }))}
                required
              />
              <Select
                label="Tài khoản demo"
                value={id}
                onChange={setId}
                options={db.users
                  .filter(
                    (u) =>
                      u.role === role &&
                      u.active &&
                      (!u.branchId || db.branches.some((b) => b.id === u.branchId && b.active)),
                  )
                  .map((u) => ({
                    id: u.id,
                    name:
                      u.name +
                      (u.branchId
                        ? ' · ' + db.branches.find((b) => b.id === u.branchId)?.name
                        : ''),
                  }))}
                required
              />
            </>
          )}
          <Alert error={error} />
          <button className="button full" type="submit">
            {register ? 'Tạo hồ sơ và tiếp tục' : 'Vào không gian làm việc'} →
          </button>
        </form>
        <p className="muted small-text">
          Dữ liệu chỉ lưu tại trình duyệt này. Có thể đổi vai trò bằng cách đăng xuất và chọn tài
          khoản khác.
        </p>
      </section>
    </div>
  );
}
const DRAFT = 'antam-booking-draft';
export function BookingPage() {
  const [params] = useSearchParams();
  return <BookingForm key={params.toString()} />;
}
function BookingForm() {
  const { db, user, dispatch } = useHospital();
  const [params] = useSearchParams();
  const [form, setForm] = useState(() => {
    let saved = {};
    try {
      saved = JSON.parse(sessionStorage.getItem(DRAFT) || '{}') || {};
    } catch {
      /* Ignore a corrupt draft. */
    }
    return initialBooking(db, params, saved);
  });
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  useEffect(() => {
    if (!result) {
      try {
        sessionStorage.setItem(DRAFT, JSON.stringify(form));
      } catch {
        /* Booking can continue without a draft. */
      }
    }
  }, [form, result]);
  const branch = db.branches.find((b) => b.id === form.branchId && b.active);
  const pack = db.packages.find((p) => p.id === form.packageId && p.active);
  const doctors = db.doctors.filter(
    (d) =>
      d.active &&
      d.branchId === branch?.id &&
      d.specialtyId === form.specialtyId &&
      db.departments.some((dep) => dep.id === d.departmentId && dep.active),
  );
  const doctor = doctors.find((d) => d.id === form.doctorId);
  const specialties = db.specialties.filter(
    (s) =>
      s.active &&
      (!branch ||
        db.departments.some((d) => d.branchId === branch.id && d.specialtyId === s.id && d.active)),
  );
  const packages = db.packages.filter(
    (p) => p.active && (!branch || p.branchIds.includes(branch.id)),
  );
  const querySelection = initialBooking(db, params);
  const invalidQuery = ['branchId', 'doctorId', 'packageId', 'specialtyId', 'date'].some(
    (key) => params.get(key) && params.get(key) !== querySelection[key],
  );
  function change(field, value) {
    const next = { ...form, [field]: value };
    if (field === 'branchId') {
      const specialtyApplies = db.departments.some(
        (d) => d.branchId === value && d.specialtyId === form.specialtyId && d.active,
      );
      const packageApplies = pack?.branchIds.includes(value) && specialtyApplies;
      Object.assign(next, {
        specialtyId: specialtyApplies ? form.specialtyId : '',
        packageId: packageApplies ? form.packageId : '',
        doctorId: '',
        date: '',
        time: '',
      });
    }
    if (field === 'specialtyId')
      Object.assign(next, { packageId: '', doctorId: '', date: '', time: '' });
    if (field === 'packageId')
      Object.assign(next, {
        specialtyId: db.packages.find((p) => p.id === value)?.specialtyId || '',
        doctorId: '',
        date: '',
        time: '',
      });
    if (field === 'doctorId') Object.assign(next, { date: '', time: '' });
    if (field === 'date') next.time = '';
    setForm(next);
    setError('');
  }
  const patientName = form.patientName || user?.name || '';
  const phone = form.phone || user?.phone || '';
  function next(e) {
    e.preventDefault();
    setError('');
    if (
      !branch ||
      !doctor ||
      !specialties.some((s) => s.id === form.specialtyId) ||
      (form.packageId &&
        (!pack || !pack.branchIds.includes(branch.id) || pack.specialtyId !== doctor.specialtyId))
    ) {
      setError('Chọn lại cơ sở, chuyên khoa/gói khám và bác sĩ phù hợp.');
      setStep(1);
      return;
    }
    if (
      step >= 2 &&
      !availableSlots(db, doctor.id, form.date).some((s) => s.time === form.time && s.available)
    ) {
      setError('Chọn ngày và khung giờ còn trống.');
      setStep(2);
      return;
    }
    if (step === 3 && (!patientName.trim() || !/^0\d{9}$/.test(phone))) {
      setError('Nhập họ tên và số điện thoại hợp lệ.');
      return;
    }
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    try {
      const id = dispatch('book', { ...form, patientName, phone });
      setResult(id);
      sessionStorage.removeItem(DRAFT);
    } catch (e) {
      setError(e.message);
    }
  }
  if (result)
    return (
      <div className="container page">
        <div className="panel confirmation">
          <span className="success-symbol">✓</span>
          <h1>Đã tạo lịch hẹn demo</h1>
          <p>
            Mã lịch: <strong>{result}</strong>
          </p>
          <p>
            {branch.name} · {doctor.name}
          </p>
          <p>
            {form.date} lúc {form.time} · Đang chờ bác sĩ duyệt
          </p>
          <Link className="button" to="/lich-hen">
            Theo dõi lịch hẹn
          </Link>
        </div>
      </div>
    );
  return (
    <div className="container page">
      <PageTitle
        title="Đặt lịch khám"
        description="Chọn cơ sở thuận tiện và khung giờ phù hợp với bạn."
      />
      <div className="booking-layout">
        <section className="panel">
          <ol className="steps">
            {['Chọn nơi khám', 'Chọn lịch', 'Người khám', 'Xác nhận'].map((name, i) => (
              <li className={step === i + 1 ? 'current' : step > i + 1 ? 'done' : ''} key={name}>
                <span>{i + 1}</span>
                {name}
              </li>
            ))}
          </ol>
          {invalidQuery && (
            <p className="alert error">
              Liên kết có lựa chọn không hợp lệ. Vui lòng chọn lại thông tin bên dưới.
            </p>
          )}
          <form onSubmit={next}>
            {step === 1 && (
              <>
                <h2>Bạn muốn khám tại đâu?</h2>
                <fieldset className="branch-picker">
                  <legend>Chọn cơ sở khám</legend>
                  <div className="branch-options">
                    {db.branches
                      .filter((b) => b.active)
                      .map((b) => (
                        <label
                          key={b.id}
                          className={'branch-option ' + (form.branchId === b.id ? 'selected' : '')}
                        >
                          <input
                            type="radio"
                            name="branchId"
                            value={b.id}
                            checked={form.branchId === b.id}
                            onChange={() => change('branchId', b.id)}
                            required
                          />
                          <Photo src={b.image} alt={'Ảnh minh họa ' + b.name} />
                          <span>
                            <strong>{b.name}</strong>
                            <small>{b.address}</small>
                          </span>
                        </label>
                      ))}
                  </div>
                </fieldset>
                <div className="form-grid">
                  <Select
                    label="Chuyên khoa"
                    value={form.specialtyId}
                    onChange={(v) => change('specialtyId', v)}
                    options={specialties}
                    required
                  />
                  <Select
                    label="Hoặc chọn gói khám"
                    value={form.packageId}
                    onChange={(v) => change('packageId', v)}
                    options={packages}
                    placeholder="Khám chuyên khoa thông thường"
                  />
                </div>
                {branch && form.specialtyId && !doctors.length && (
                  <p className="notice">
                    Chưa có bác sĩ nhận khám. Vui lòng đổi chuyên khoa hoặc cơ sở.
                  </p>
                )}
                <Select
                  label="Bác sĩ"
                  value={form.doctorId}
                  onChange={(v) => change('doctorId', v)}
                  options={doctors}
                  required
                />
              </>
            )}
            {step === 2 && (
              <>
                <h2>Chọn khung giờ của bạn</h2>
                <Field label="Ngày khám">
                  <input
                    type="date"
                    min={dateKey()}
                    value={form.date}
                    onChange={(e) => change('date', e.target.value)}
                    required
                  />
                </Field>
                <p className="muted">
                  Lịch đang mở đến{' '}
                  {db.schedules
                    .filter((s) => s.doctorId === form.doctorId)
                    .map((s) => s.date)
                    .sort()
                    .at(-1) || 'chưa xác định'}
                  .
                </p>
                <div className="time-grid">
                  {availableSlots(db, form.doctorId, form.date).map((s) => (
                    <button
                      type="button"
                      disabled={!s.available}
                      className={form.time === s.time ? 'selected' : ''}
                      key={s.time}
                      onClick={() => change('time', s.time)}
                    >
                      {s.time}
                      <small>{s.available ? 'Còn trống' : 'Không khả dụng'}</small>
                    </button>
                  ))}
                </div>
                {form.date && !availableSlots(db, form.doctorId, form.date).length && (
                  <p className="notice">Bác sĩ chưa mở lịch ngày này. Vui lòng chọn ngày khác.</p>
                )}
              </>
            )}
            {step === 3 && (
              <>
                <h2>Thông tin người khám</h2>
                <p className="muted">Phiên bản này đặt khám cho chính tài khoản bệnh nhân.</p>
                <div className="form-grid">
                  <Field label="Họ tên">
                    <input
                      value={patientName}
                      onChange={(e) => change('patientName', e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Số điện thoại">
                    <input
                      type="tel"
                      value={phone}
                      pattern="0[0-9]{9}"
                      onChange={(e) => change('phone', e.target.value)}
                      required
                    />
                  </Field>
                </div>
                <Field label="Ghi chú nhu cầu khám">
                  <textarea value={form.notes} onChange={(e) => change('notes', e.target.value)} />
                </Field>
              </>
            )}
            {step === 4 && (
              <>
                <h2>Kiểm tra trước khi đặt</h2>
                <dl className="summary">
                  <dt>Người khám</dt>
                  <dd>
                    {patientName} · {phone}
                  </dd>
                  <dt>Thời gian</dt>
                  <dd>
                    {form.date} · {form.time}
                  </dd>
                  <dt>Nhu cầu</dt>
                  <dd>{form.notes || 'Không có ghi chú'}</dd>
                </dl>
                <p className="notice">Đây là lịch hẹn demo, chỉ lưu trên trình duyệt này.</p>
                {!user && (
                  <Link
                    className="button"
                    to={'/dang-nhap?next=' + encodeURIComponent('/dat-lich')}
                  >
                    Đăng nhập trước khi xác nhận
                  </Link>
                )}
                {user && user.role !== 'patient' && (
                  <p className="alert error">Hãy đăng nhập bằng tài khoản bệnh nhân để đặt khám.</p>
                )}
              </>
            )}
            <Alert error={error} />
            <div className="actions form-actions">
              {step > 1 && (
                <button type="button" className="button outline" onClick={() => setStep(step - 1)}>
                  Quay lại
                </button>
              )}
              <button
                type="submit"
                className="button"
                disabled={step === 4 && user?.role !== 'patient'}
              >
                {step === 4 ? 'Xác nhận đặt lịch' : 'Tiếp tục →'}
              </button>
            </div>
          </form>
        </section>
        <aside className="panel booking-summary">
          <span className="eyebrow">LỊCH KHÁM CỦA BẠN</span>
          <h2>{branch?.name || 'Chọn cơ sở An Tâm'}</h2>
          <p>{branch?.address}</p>
          <dl className="summary">
            <dt>Dịch vụ</dt>
            <dd>
              {pack?.name ||
                db.specialties.find((s) => s.id === form.specialtyId)?.name ||
                'Chưa chọn'}
            </dd>
            <dt>Bác sĩ</dt>
            <dd>{doctor?.name || 'Chưa chọn'}</dd>
            <dt>Ngày / giờ</dt>
            <dd>
              {form.date || 'Chưa chọn'} {form.time}
            </dd>
            <dt>Phí khám dự kiến</dt>
            <dd className="price">{money(pack?.price || doctor?.price)}</dd>
          </dl>
          <small>Thông tin và chi phí minh họa. Không thanh toán trực tuyến.</small>
        </aside>
      </div>
    </div>
  );
}
export function ProfilePage() {
  const { user, dispatch } = useHospital();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  function submit(e) {
    e.preventDefault();
    try {
      dispatch('profile', Object.fromEntries(new FormData(e.currentTarget)));
      setSuccess('Đã cập nhật hồ sơ.');
      setError('');
    } catch (e) {
      setError(e.message);
      setSuccess('');
    }
  }
  return (
    <div className="container page compact">
      <PageTitle title="Hồ sơ cá nhân" description={roles[user.role]} />
      <form className="panel" onSubmit={submit} key={user.id}>
        <div className="form-grid">
          <Field label="Họ tên">
            <input name="name" defaultValue={user.name} required />
          </Field>
          <Field label="Số điện thoại">
            <input type="tel" name="phone" defaultValue={user.phone} pattern="0[0-9]{9}" required />
          </Field>
          <Field label="Ngày sinh">
            <input type="date" name="birthDate" defaultValue={user.birthDate} max={dateKey()} />
          </Field>
          <Field label="Địa chỉ">
            <input name="address" defaultValue={user.address} />
          </Field>
        </div>
        <Alert error={error} success={success} />
        <button className="button">Lưu thay đổi</button>
        {user.role === 'patient' && (
          <div className="actions">
            <Link to="/lich-hen">Lịch hẹn của tôi →</Link>
            <Link to="/ho-so-kham">Hồ sơ khám →</Link>
          </div>
        )}
      </form>
    </div>
  );
}
