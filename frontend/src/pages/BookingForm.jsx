import { bookingQuote } from '../helpers/PricingHelpers';
import { insuranceInput, insurancePolicy } from '../helpers/InsuranceHelpers';
import { PriceBreakdown } from '../components/PriceBreakdown';
import { InsuranceFields } from '../components/InsuranceFields';
import { PromotionInput } from '../components/PromotionInput';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useHospital } from '../state/context';
import { dateKey } from '../data/seed';
import { availableSlots } from '../data/domain';
import { initialBooking } from '../data/booking';
import { Photo } from '../components/Photo';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';
import { PageTitle } from '../components/PageTitle';
import { Select } from '../components/Select';
import { DRAFT } from '../helpers/PatientHelpers';

export function BookingForm() {
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
  const quote = bookingQuote(db, form, user?.id);
  const policy = insurancePolicy(db, form.branchId, form.date);
  const supportsInsurance =
    !!policy?.enabled &&
    policy.services.some(
      (s) =>
        s.serviceId === (form.packageId ? 'package:' + form.packageId : 'consultation') &&
        s.tariff > 0,
    );
  const patientName = form.patientName || user?.name || '';
  const phone = form.phone || user?.phone || '';
  async function next(e) {
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
    if (step >= 3) {
      try {
        insuranceInput(form.insurance);
        if (form.insurance?.enabled && !supportsInsurance)
          throw new Error('Cơ sở/dịch vụ chưa hỗ trợ BHYT cho ngày khám này.');
        if (step === 4 && quote.error) throw new Error(quote.error);
      } catch (error) {
        setError(error.message);
        return;
      }
    }
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    try {
      const id = await dispatch('book', { ...form, patientName, phone });
      setResult(id);
      sessionStorage.removeItem(DRAFT);
    } catch (e) {
      setError(e.message);
    }
  }
  if (result)
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[55vh] py-10 sm:py-14">
        <div
          data-testid="booking-confirmation"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm"
        >
          <span className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-emerald-600 text-3xl text-white">
            ✓
          </span>
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
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50"
            to="/lich-hen"
          >
            Theo dõi lịch hẹn
          </Link>
        </div>
      </div>
    );
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[55vh] py-10 sm:py-14">
      <PageTitle
        title="Đặt lịch khám"
        description="Chọn cơ sở thuận tiện và khung giờ phù hợp với bạn."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900">
          <ol className="mb-7 flex gap-2 overflow-x-auto pb-2 [&_li]:flex min-w-max items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-500 [&_li>span]:grid [&_li>span]:size-6 [&_li>span]:place-items-center [&_li>span]:rounded-full [&_li>span]:bg-white [&_li>span]:font-bold">
            {['Chọn nơi khám', 'Chọn lịch', 'Người khám', 'Xác nhận'].map((name, i) => (
              <li
                className={
                  step === i + 1
                    ? 'bg-sky-600! text-white! [&>span]:text-sky-700!'
                    : step > i + 1
                      ? 'bg-emerald-50! text-emerald-700!'
                      : ''
                }
                key={name}
              >
                <span>{i + 1}</span>
                {name}
              </li>
            ))}
          </ol>
          {invalidQuery && (
            <p
              className="my-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800"
              role="alert"
            >
              Liên kết có lựa chọn không hợp lệ. Vui lòng chọn lại thông tin bên dưới.
            </p>
          )}
          <form onSubmit={next}>
            {step === 1 && (
              <>
                <h2>Bạn muốn khám tại đâu?</h2>
                <fieldset className="space-y-4 [&_legend]:mb-4 [&_legend]:font-bold [&_legend]:text-brand-900">
                  <legend>Chọn cơ sở khám</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {db.branches
                      .filter((b) => b.active)
                      .map((b) => (
                        <label
                          key={b.id}
                          data-branch-id={b.id}
                          className={`relative flex min-w-0 cursor-pointer gap-4 overflow-hidden rounded-2xl border bg-white p-4 transition hover:border-sky-300 [&>span]:min-w-0 [&_small]:mt-1 [&_small]:block [&_small]:break-words [&_small]:text-sm [&_small]:text-slate-500 [&_strong]:block [&_strong]:break-words [&_strong]:text-brand-900 ${form.branchId === b.id ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200'}`}
                        >
                          <input
                            className="sr-only"
                            type="radio"
                            name="branchId"
                            value={b.id}
                            checked={form.branchId === b.id}
                            onChange={() => change('branchId', b.id)}
                            required
                          />
                          <Photo
                            src={b.image}
                            alt={'Ảnh minh họa ' + b.name}
                            className="h-20 w-24 shrink-0 rounded-xl object-cover"
                          />
                          <span>
                            <strong>{b.name}</strong>
                            <small>{b.address}</small>
                          </span>
                        </label>
                      ))}
                  </div>
                </fieldset>
                <div className="grid gap-4 md:grid-cols-2">
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
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
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
                <p className="text-slate-500">
                  Lịch đang mở đến{' '}
                  {db.schedules
                    .filter((s) => s.doctorId === form.doctorId)
                    .map((s) => s.date)
                    .sort()
                    .at(-1) || 'chưa xác định'}
                  .
                </p>
                <div
                  data-testid="time-grid"
                  className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 [&_button]:rounded-xl [&_button]:border [&_button]:border-slate-200 [&_button]:bg-white [&_button]:p-3 [&_button]:font-semibold [&_button]:text-brand-900 [&_button]:transition hover:[&_button]:border-sky-400 hover:[&_button]:bg-sky-50 [&_small]:block [&_small]:font-normal [&_small]:text-slate-500"
                >
                  {availableSlots(db, form.doctorId, form.date).map((s) => (
                    <button
                      type="button"
                      disabled={!s.available}
                      className={
                        form.time === s.time
                          ? 'border-sky-600! bg-sky-600! text-white! [&_small]:text-sky-100!'
                          : ''
                      }
                      key={s.time}
                      onClick={() => change('time', s.time)}
                    >
                      {s.time}
                      <small>{s.available ? 'Còn trống' : 'Không khả dụng'}</small>
                    </button>
                  ))}
                </div>
                {form.date && !availableSlots(db, form.doctorId, form.date).length && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Bác sĩ chưa mở lịch ngày này. Vui lòng chọn ngày khác.
                  </p>
                )}
              </>
            )}
            {step === 3 && (
              <>
                <h2>Thông tin người khám</h2>
                <InsuranceFields
                  value={form.insurance}
                  onChange={(value) => change('insurance', value)}
                  supported={supportsInsurance}
                />
                <p className="text-slate-500">
                  Phiên bản này đặt khám cho chính tài khoản bệnh nhân.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
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
                <PromotionInput
                  code={form.promotionCode}
                  onApply={(value) => change('promotionCode', value)}
                  quote={quote}
                />
                <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm [&_dt]:text-slate-500 [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-semibold [&_dd]:text-slate-800">
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
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Đây là lịch hẹn demo, chỉ lưu trên trình duyệt này.
                </p>
                {!user && (
                  <Link
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50"
                    to={'/dang-nhap?next=' + encodeURIComponent('/dat-lich')}
                  >
                    Đăng nhập trước khi xác nhận
                  </Link>
                )}
                {user && user.role !== 'patient' && (
                  <p className="my-4 rounded-xl border p-4 text-sm font-medium border-red-200 bg-red-50 text-red-800">
                    Hãy đăng nhập bằng tài khoản bệnh nhân để đặt khám.
                  </p>
                )}
              </>
            )}
            <Alert error={error} />
            <div className="flex flex-wrap items-center gap-3 mt-6 flex flex-wrap items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 border border-sky-200 bg-white text-sky-700 shadow-none hover:border-sky-300 hover:bg-sky-50"
                  onClick={() => setStep(step - 1)}
                >
                  Quay lại
                </button>
              )}
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50"
                disabled={step === 4 && user?.role !== 'patient'}
              >
                {step === 4 ? 'Xác nhận đặt lịch' : 'Tiếp tục →'}
              </button>
            </div>
          </form>
        </section>
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900 sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
            LỊCH KHÁM CỦA BẠN
          </span>
          <h2>{branch?.name || 'Chọn cơ sở An Tâm'}</h2>
          <p>{branch?.address}</p>
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm [&_dt]:text-slate-500 [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-semibold [&_dd]:text-slate-800">
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
          </dl>
          <PriceBreakdown price={quote.price} />
          <small>
            Dự toán sẽ được đối chiếu với dịch vụ thực hiện sau khám. Không thanh toán trực tuyến.
          </small>
        </aside>
      </div>
    </div>
  );
}
