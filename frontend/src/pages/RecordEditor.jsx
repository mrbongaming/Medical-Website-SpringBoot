import { ServiceEditor } from '../components/ServiceEditor';
import { useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useHospital } from '../state/context';
import { accessibleRecords } from '../data/domain';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import { Field } from '../components/Field';
import { Modal } from '../components/Modal';
import { PageTitle } from '../components/PageTitle';
import { formatDate, name } from '../helpers/ClinicalHelpers';

export function RecordEditor({ appointment }) {
  const { db, user, dispatch } = useHospital();
  const navigate = useNavigate();
  const record = db.records.find((r) => r.appointmentId === appointment.id);
  const [services, setServices] = useState(() =>
    (appointment.billing?.items || [])
      .slice(1)
      .map((i) => ({ serviceId: i.serviceId, quantity: i.quantity })),
  );
  const [serviceReason, setServiceReason] = useState(appointment.billing?.serviceReason || '');
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const allowNavigation = useRef(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      !allowNavigation.current &&
      currentLocation.pathname + currentLocation.search !==
        nextLocation.pathname + nextLocation.search,
  );
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const history = accessibleRecords(db, user)
    .filter((r) => r.patientId === appointment.patientId && r.id !== record?.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  function submit(e) {
    e.preventDefault();
    try {
      const finalized = e.nativeEvent.submitter?.value === 'complete';
      allowNavigation.current = finalized;
      dispatch('record', {
        ...Object.fromEntries(new FormData(e.currentTarget)),
        appointmentId: appointment.id,
        finalized,
        services,
        serviceReason,
      });
      setDirty(false);
      setError('');
      setSuccess('Đã lưu bản nháp.');
      if (finalized) navigate('/bac-si-lam-viec/ho-so?patientId=' + appointment.patientId);
    } catch (e) {
      allowNavigation.current = false;
      setError(e.message);
    }
  }
  return (
    <>
      <Link
        data-testid="back-link"
        className="mb-5 inline-flex items-center gap-2 font-semibold text-sky-700"
        to="/bac-si-lam-viec"
      >
        <FiArrowLeft /> Lịch khám
      </Link>
      <PageTitle
        title={'Khám bệnh · ' + appointment.patientName}
        description={
          formatDate(appointment.date) + ' · ' + appointment.time + ' · ' + appointment.serviceName
        }
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-900 p-5 text-white [&_small]:block [&_small]:text-sky-200">
        <span>
          <strong>{appointment.patientName}</strong>
          <small>{appointment.phone}</small>
        </span>
        <span>
          {name(db, 'branches', appointment.branchId)}
          <small>Mã lịch: {appointment.id}</small>
        </span>
        <Badge status="confirmed" />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900">
          <h2>Ghi kết quả khám</h2>
          <form
            onSubmit={submit}
            onChange={() => {
              setDirty(true);
              setSuccess('');
            }}
          >
            <Field label="Triệu chứng">
              <textarea name="symptoms" defaultValue={record?.symptoms} rows={3} />
            </Field>
            <Field label="Chẩn đoán">
              <textarea name="diagnosis" defaultValue={record?.diagnosis} rows={3} />
            </Field>
            <Field label="Ghi chú / hướng dẫn">
              <textarea name="notes" defaultValue={record?.notes} rows={4} />
            </Field>
            <Field label="Ngày tái khám (nếu có)">
              <input
                type="date"
                name="followUp"
                defaultValue={record?.followUp}
                min={appointment.date}
              />
            </Field>
            <ServiceEditor
              savedItems={appointment.billing.items}
              catalog={db.serviceCatalog}
              value={services}
              onChange={setServices}
              reason={serviceReason}
              onReason={setServiceReason}
            />
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Hoàn tất sẽ chuyển kết quả sang chỉ đọc và hiển thị cho bệnh nhân.
            </p>
            {!appointment.billing.legacy && !appointment.billing.receivedAt && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Chờ nhân viên xác nhận tiếp nhận. Bạn có thể lưu nháp; chỉ hoàn tất khám sau khi
                bệnh nhân đã được tiếp nhận.
              </p>
            )}
            <Alert error={error} success={success} />
            <div className="flex flex-wrap items-center gap-3 mt-6 flex flex-wrap items-center gap-3">
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 border border-sky-200 bg-white text-sky-700 shadow-none hover:border-sky-300 hover:bg-sky-50"
                value="draft"
              >
                Lưu nháp
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50"
                value="complete"
              >
                Hoàn tất buổi khám
              </button>
              {dirty && <span className="text-slate-500">Có thay đổi chưa lưu</span>}
            </div>
          </form>
        </section>
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900 space-y-4">
          <h2>Lịch sử liên quan</h2>
          <p>Các lần khám của bệnh nhân tại cơ sở bạn được phép xem.</p>
          {history.length ? (
            history.map((r) => (
              <Link
                className="grid gap-3 sm:grid-cols-2 [&>*]:rounded-xl [&>*]:bg-slate-50 [&>*]:p-3"
                key={r.id}
                to={'/bac-si-lam-viec/ho-so/' + r.id}
              >
                <small>{formatDate(r.date)}</small>
                <strong>{r.diagnosis || 'Bản nháp'}</strong>
                <span>{name(db, 'doctors', r.doctorId)}</span>
              </Link>
            ))
          ) : (
            <p>Chưa có lần khám trước.</p>
          )}
        </aside>
      </div>
      {blocker.state === 'blocked' && (
        <Modal title="Bạn có thay đổi chưa lưu" close={() => blocker.reset()}>
          <p>Rời trang sẽ bỏ những thay đổi chưa được lưu vào bản nháp.</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 border border-sky-200 bg-white text-sky-700 shadow-none hover:border-sky-300 hover:bg-sky-50"
              onClick={() => blocker.reset()}
            >
              Tiếp tục chỉnh sửa
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                setDirty(false);
                blocker.proceed();
              }}
            >
              Rời trang
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
