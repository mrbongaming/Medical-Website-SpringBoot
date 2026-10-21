import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useHospital } from '../state/context';

function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function BookingFormLive() {
  const { db, user, bookAppointment } = useHospital();
  const [bookingWindow] = useState(() => ({ min: dateAfter(1), max: dateAfter(119) }));
  const [params] = useSearchParams();
  const [branchId, setBranchId] = useState(params.get('branchId') || '');
  const [packageId, setPackageId] = useState(params.get('packageId') || '');
  const [doctorId, setDoctorId] = useState(params.get('doctorId') || '');
  const [date, setDate] = useState(params.get('date') || '');
  const [time, setTime] = useState('');
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [recipientType, setRecipientType] = useState('self');
  const [relationship, setRelationship] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedDoctor = db.doctors.find((row) => row.id === doctorId);
  const selectedPackage = db.packages.find((row) => row.id === packageId);
  const effectiveBranchId =
    branchId || selectedDoctor?.branchId || selectedPackage?.branchIds?.[0] || '';
  const packages = db.packages.filter(
    (row) => row.active && row.branchIds?.includes(effectiveBranchId),
  );
  const doctors = db.doctors.filter(
    (row) =>
      row.active &&
      row.branchId === effectiveBranchId &&
      (!selectedPackage || row.specialtyId === selectedPackage.specialtyId),
  );
  const specialtyId = selectedPackage?.specialtyId || selectedDoctor?.specialtyId || '';
  const days = db.schedulePreviews.filter((row) => row.doctorId === doctorId);
  const slots = days.find((row) => row.date === date)?.times || [];
  const price = selectedPackage?.price || selectedDoctor?.price || 0;

  const bookingName = recipientType === 'self' ? patientName || user?.name || '' : patientName;
  const bookingPhone = recipientType === 'self' ? phone || user?.phone || '' : phone;
  const bookingBirthDate =
    recipientType === 'self' ? birthDate || user?.birthDate || '' : birthDate;
  const bookingAddress = recipientType === 'self' ? address || user?.address || '' : address;

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!user) {
      setError('Vui lòng đăng nhập trước khi đặt lịch.');
      return;
    }
    if (user.role !== 'patient') {
      setError('Chỉ tài khoản bệnh nhân được đặt lịch.');
      return;
    }
    if (!selectedPackage && !selectedDoctor) {
      setError('Vui lòng chọn gói khám hoặc bác sĩ.');
      return;
    }
    if (selectedDoctor && !slots.includes(time)) {
      setError('Vui lòng chọn khung giờ còn trống.');
      return;
    }
    setSubmitting(true);
    try {
      const id = await bookAppointment({
        branchId: effectiveBranchId,
        specialtyId,
        packageId: packageId || null,
        doctorId: doctorId || null,
        date,
        time: doctorId ? time : null,
        recipientType,
        relationship: recipientType === 'relative' ? relationship : null,
        patientName: bookingName,
        phone: bookingPhone,
        patientBirthDate: bookingBirthDate || null,
        patientAddress: bookingAddress || null,
        notes,
      });
      setResult(id);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result)
    return (
      <section className="mx-auto my-12 max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h1 className="text-2xl font-bold">Đã giữ lịch khám</h1>
        <p className="mt-3">
          Mã lịch: <strong>{result}</strong>. Vui lòng thanh toán trong 15 phút để xác nhận.
        </p>
        <Link
          className="mt-5 inline-block rounded-lg bg-sky-700 px-5 py-3 font-semibold text-white"
          to="/lich-hen"
        >
          Xem lịch hẹn và thanh toán
        </Link>
      </section>
    );

  return (
    <section className="mx-auto my-10 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-brand-900">Đặt lịch khám trực tuyến</h1>
      {!user && (
        <p className="my-4 rounded-lg bg-amber-50 p-4">
          Vui lòng{' '}
          <Link
            className="font-semibold text-sky-700 underline"
            to={`/dang-nhap?next=${encodeURIComponent('/dat-lich' + window.location.search)}`}
          >
            đăng nhập
          </Link>{' '}
          trước khi đặt lịch.
        </p>
      )}
      {user && user.role !== 'patient' && (
        <p className="my-4 rounded-lg bg-amber-50 p-4">Chỉ tài khoản bệnh nhân được đặt lịch.</p>
      )}
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <label className="grid gap-1 font-semibold">
          Cơ sở
          <select
            required
            value={effectiveBranchId}
            onChange={(e) => {
              setBranchId(e.target.value);
              setPackageId('');
              setDoctorId('');
              setDate('');
              setTime('');
            }}
            className="rounded-lg border p-3"
          >
            <option value="">Chọn cơ sở</option>
            {db.branches
              .filter((row) => row.active)
              .map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
          </select>
        </label>
        <label className="grid gap-1 font-semibold">
          Gói khám (tùy chọn)
          <select
            value={packageId}
            onChange={(e) => {
              setPackageId(e.target.value);
              setDoctorId('');
              setDate('');
              setTime('');
            }}
            className="rounded-lg border p-3"
          >
            <option value="">Không chọn gói</option>
            {packages.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 font-semibold">
          Bác sĩ {selectedPackage ? '(tùy chọn)' : ''}
          <select
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value);
              setDate('');
              setTime('');
            }}
            className="rounded-lg border p-3"
          >
            <option value="">{selectedPackage ? 'Cơ sở sắp xếp bác sĩ' : 'Chọn bác sĩ'}</option>
            {doctors.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 font-semibold">
          Ngày khám
          {doctorId ? (
            <select
              required
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTime('');
              }}
              className="rounded-lg border p-3"
            >
              <option value="">Chọn ngày còn lịch</option>
              {days.map((row) => (
                <option key={row.date} value={row.date}>
                  {row.date}
                </option>
              ))}
            </select>
          ) : (
            <input
              required
              type="date"
              min={bookingWindow.min}
              max={bookingWindow.max}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border p-3"
            />
          )}
        </label>
        {doctorId && (
          <label className="grid gap-1 font-semibold">
            Giờ khám
            <select
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-lg border p-3"
            >
              <option value="">Chọn giờ</option>
              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>
        )}
        <p className="rounded-lg bg-sky-50 p-3">
          Chi phí dự kiến: <strong>{Number(price).toLocaleString('vi-VN')} ₫</strong>
        </p>
        <label className="grid gap-1 font-semibold">
          Đặt cho
          <select
            value={recipientType}
            onChange={(e) => {
              setRecipientType(e.target.value);
              setPatientName('');
              setPhone('');
              setBirthDate('');
              setAddress('');
            }}
            className="rounded-lg border p-3"
          >
            <option value="self">Bản thân</option>
            <option value="relative">Người thân</option>
          </select>
        </label>
        {recipientType === 'relative' && (
          <label className="grid gap-1 font-semibold">
            Quan hệ
            <input
              required
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="rounded-lg border p-3"
            />
          </label>
        )}
        <label className="grid gap-1 font-semibold">
          Họ tên người khám
          <input
            required
            value={bookingName}
            onChange={(e) => setPatientName(e.target.value)}
            className="rounded-lg border p-3"
          />
        </label>
        <label className="grid gap-1 font-semibold">
          Số điện thoại
          <input
            required
            pattern="0[0-9]{9}"
            type="tel"
            value={bookingPhone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border p-3"
          />
        </label>
        <label className="grid gap-1 font-semibold">
          Ngày sinh {recipientType === 'relative' ? '' : '(tùy chọn)'}
          <input
            required={recipientType === 'relative'}
            type="date"
            value={bookingBirthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="rounded-lg border p-3"
          />
        </label>
        <label className="grid gap-1 font-semibold">
          Địa chỉ {recipientType === 'relative' ? '' : '(tùy chọn)'}
          <input
            required={recipientType === 'relative'}
            value={bookingAddress}
            onChange={(e) => setAddress(e.target.value)}
            className="rounded-lg border p-3"
          />
        </label>
        <label className="grid gap-1 font-semibold">
          Ghi chú
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-lg border p-3"
          />
        </label>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}
        <button
          disabled={submitting || user?.role !== 'patient'}
          className="rounded-lg bg-sky-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {submitting ? 'Đang đặt lịch…' : 'Giữ lịch và tiếp tục thanh toán'}
        </button>
      </form>
    </section>
  );
}
