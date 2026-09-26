import { bookingQuote } from '../helpers/PricingHelpers';
import { insuranceInput, insurancePolicy } from '../helpers/InsuranceHelpers';
import { PriceBreakdown } from '../components/PriceBreakdown';
import { InsuranceFields } from '../components/InsuranceFields';
import { PromotionInput } from '../components/PromotionInput';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useHospital } from '../state/context';
import { dateKey } from '../data/seed';
import { availableSlots, future } from '../data/domain';
import { bookingStartStep, initialBooking } from '../data/booking';
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
  const [step, setStep] = useState(() => bookingStartStep(form));
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
  const branchLocked =
    !invalidQuery &&
    !!querySelection.branchId &&
    (params.has('branchId') || params.has('doctorId') || params.has('packageId'));
  const specialtyLocked =
    !invalidQuery &&
    !!querySelection.specialtyId &&
    (params.has('specialtyId') || params.has('doctorId') || params.has('packageId'));
  const doctorLocked = !invalidQuery && !!querySelection.doctorId && params.has('doctorId');
  const packageLocked = !invalidQuery && !!querySelection.packageId && params.has('packageId');
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
    if (field === 'bookingMode')
      Object.assign(next, {
        bookingMode: value,
        doctorId: value === 'facility' ? '' : form.doctorId,
        date: '',
        time: '',
      });
    if (field === 'date') next.time = '';
    setForm(next);
    setError('');
  }
  const quote = bookingQuote(db, form, user?.id);
  const policy = insurancePolicy(db, form.branchId, form.date);
  const supportsInsurance =
    !!policy?.enabled &&
    quote.items.some((item) =>
      policy.services.some((service) => service.serviceId === item.serviceId && service.tariff > 0),
    );
  const patientName = form.patientName || user?.name || '';
  const phone = form.phone || user?.phone || '';
  async function next(e) {
    e.preventDefault();
    setError('');
    if (
      !branch ||
      (form.bookingMode === 'doctor' && !doctor) ||
      !specialties.some((s) => s.id === form.specialtyId) ||
      (form.packageId &&
        (!pack || !pack.branchIds.includes(branch.id) || pack.specialtyId !== form.specialtyId))
    ) {
      setError('Chọn lại cơ sở, chuyên khoa/gói khám và bác sĩ phù hợp.');
      setStep(1);
      return;
    }
    if (
      step >= 2 &&
      (form.bookingMode === 'doctor'
        ? !availableSlots(db, doctor.id, form.date).some((s) => s.time === form.time && s.available)
        : !form.date || !future(form.date))
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
            {branch.name} · {doctor?.name || 'Nhân viên cơ sở sắp xếp'}
          </p>
          <p>
            {form.date} {form.time ? `lúc ${form.time}` : '· Chờ xác nhận giờ'} · Đang chờ nhân viên
            xác nhận
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
          <ol className="mb-7 flex gap-2 overflow-x-auto rounded-xl bg-slate-100 p-2 text-sm text-slate-500 [&_li]:flex [&_li]:min-w-max [&_li]:items-center [&_li]:gap-2 [&_li]:rounded-lg [&_li]:px-3 [&_li]:py-2 [&_li>span]:grid [&_li>span]:size-6 [&_li>span]:place-items-center [&_li>span]:rounded-full [&_li>span]:bg-white [&_li>span]:font-bold">
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
                <h2>{branchLocked ? 'Hoàn tất lựa chọn khám' : 'Bạn muốn khám tại đâu?'}</h2>
                {branchLocked ? (
                  <div
                    data-testid="locked-branch"
                    className="mb-5 flex items-center gap-4 rounded-lg border border-sky-200 bg-sky-50 p-4"
                  >
                    <Photo
                      src={branch.image}
                      alt={'Ảnh minh họa ' + branch.name}
                      className="h-16 w-20 shrink-0 rounded-lg object-cover"
                    />
                    <span className="min-w-0">
                      <strong className="block text-brand-900">{branch.name}</strong>
                      <small className="block text-slate-600">{branch.address}</small>
                      <Link className="text-sm font-semibold text-sky-700" to="/co-so">
                        Chọn cơ sở khác
                      </Link>
                    </span>
                  </div>
                ) : (
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
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  {specialtyLocked ? (
                    <div
                      data-testid="locked-specialty"
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <small className="block text-slate-500">Chuyên khoa đã chọn</small>
                      <strong>{db.specialties.find((s) => s.id === form.specialtyId)?.name}</strong>
                    </div>
                  ) : (
                    <Select
                      label="Chuyên khoa"
                      value={form.specialtyId}
                      onChange={(v) => change('specialtyId', v)}
                      options={specialties}
                      required
                    />
                  )}
                  {packageLocked ? (
                    <div
                      data-testid="locked-package"
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <small className="block text-slate-500">Gói khám đã chọn</small>
                      <strong>{pack?.name}</strong>
                    </div>
                  ) : (
                    <Select
                      label="Hoặc chọn gói khám"
                      value={form.packageId}
                      onChange={(v) => change('packageId', v)}
                      options={packages}
                      placeholder="Khám chuyên khoa thông thường"
                    />
                  )}
                </div>
                {branch && form.specialtyId && !doctors.length && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Chưa có bác sĩ nhận khám. Vui lòng đổi chuyên khoa hoặc cơ sở.
                  </p>
                )}
                {!doctorLocked && (
                  <Select
                    label="Hình thức đặt lịch"
                    value={form.bookingMode}
                    onChange={(v) => change('bookingMode', v)}
                    options={[
                      { id: 'doctor', name: 'Chọn bác sĩ và giờ khám' },
                      { id: 'facility', name: 'Không chọn bác sĩ · nhân viên sắp xếp' },
                    ]}
                    required
                  />
                )}
                {doctorLocked ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <small className="block text-slate-500">Bác sĩ đã chọn</small>
                    <strong>{doctor?.name}</strong>
                  </div>
                ) : (
                  form.bookingMode === 'doctor' && (
                    <Select
                      label="Bác sĩ"
                      value={form.doctorId}
                      onChange={(v) => change('doctorId', v)}
                      options={doctors}
                      required
                    />
                  )
                )}
              </>
            )}
            {step === 2 && (
              <>
                <h2>
                  {form.bookingMode === 'doctor' ? 'Chọn khung giờ của bạn' : 'Chọn ngày khám'}
                </h2>
                <Field label="Ngày khám">
                  <input
                    type="date"
                    min={dateKey()}
                    value={form.date}
                    onChange={(e) => change('date', e.target.value)}
                    required
                  />
                </Field>
                {form.bookingMode === 'doctor' && (
                  <p className="text-slate-500">
                    Lịch đang mở đến{' '}
                    {db.schedules
                      .filter((s) => s.doctorId === form.doctorId)
                      .map((s) => s.date)
                      .sort()
                      .at(-1) || 'chưa xác định'}
                    .
                  </p>
                )}
                {form.bookingMode === 'facility' && (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    Nhân viên sẽ xác nhận giờ tiếp nhận trong giờ hoạt động của cơ sở khi duyệt
                    lịch.
                  </p>
                )}
                {form.bookingMode === 'doctor' && (
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
                )}
                {form.bookingMode === 'doctor' &&
                  form.date &&
                  !availableSlots(db, form.doctorId, form.date).length && (
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
                    {form.date} · {form.time || 'Chờ nhân viên xác nhận giờ'}
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
                    to={
                      '/dang-nhap?next=' +
                      encodeURIComponent('/dat-lich' + (params.toString() ? `?${params}` : ''))
                    }
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
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-sky-800 hover:bg-sky-50"
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
            <dd>
              {doctor?.name ||
                (form.bookingMode === 'facility' ? 'Không chọn bác sĩ' : 'Chưa chọn')}
            </dd>
            <dt>Ngày / giờ</dt>
            <dd>
              {form.date || 'Chưa chọn'}{' '}
              {form.time ||
                (form.date && form.bookingMode === 'facility' ? '· Chờ xác nhận giờ' : '')}
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
