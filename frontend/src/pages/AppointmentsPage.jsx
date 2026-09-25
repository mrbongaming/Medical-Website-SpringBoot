import { BillingPanel } from '../components/BillingPanel';
import { financialBalance } from '../helpers/PricingHelpers';
import { insuranceStatuses } from '../helpers/InsuranceHelpers';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiMapPin } from 'react-icons/fi';
import { useHospital } from '../state/context';
import { isAdmin, future } from '../data/domain';
import { statuses, money, dateKey } from '../data/seed';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import { Empty } from '../components/Empty';
import { Field } from '../components/Field';
import { FilterPanel } from '../components/FilterPanel';
import { Modal } from '../components/Modal';
import { PageTitle } from '../components/PageTitle';
import { Select } from '../components/Select';
import { Table } from '../components/Table';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { formatDate, name, recordBase } from '../helpers/ClinicalHelpers';
import { getFilteredAppointments } from '../helpers/AppointmentHelpers';

export function AppointmentsPage() {
  const { db, user, dispatch } = useHospital();
  const patient = user.role === 'patient';
  const doctor = user.role === 'doctor';
  const receptionist = user.role === 'staff' || isAdmin(user);
  const [period, setPeriod] = useState('upcoming');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState(doctor ? dateKey() : '');
  const [branchId, setBranchId] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [action, setAction] = useState(null);
  const [billingId, setBillingId] = useState('');
  const rows = getFilteredAppointments(db, user, { period, status, date, branchId, query });
  const cards = usePagination(rows, 8);
  function open(row, type) {
    setAction({ row, type });
    setError('');
    setSuccess('');
  }
  async function submit(e) {
    e.preventDefault();
    try {
      await dispatch(action.type === 'pay' ? 'pay' : 'appointment', {
        id: action.row.id,
        status: action.type,
        ...Object.fromEntries(new FormData(e.currentTarget)),
      });
      setSuccess(
        action.type === 'pay' ? 'Đã ghi nhận thu tiền mô phỏng.' : 'Đã cập nhật lịch hẹn.',
      );
      setError('');
      setAction(null);
    } catch (e) {
      setError(e.message);
    }
  }
  function actions(a) {
    const record = db.records.find((r) => r.appointmentId === a.id && r.finalized);
    return (
      <div className="flex flex-wrap gap-2 [&>a]:text-sm [&>a]:font-semibold [&>a]:text-sky-700 [&>button]:border-0 [&>button]:bg-transparent [&>button]:p-0 [&>button]:text-sm [&>button]:font-semibold [&>button]:text-sky-700">
        {receptionist && a.status === 'pending' && (
          <>
            <button onClick={() => open(a, 'confirmed')}>Chấp nhận</button>
            <button className="text-red-600!" onClick={() => open(a, 'rejected')}>
              Từ chối
            </button>
          </>
        )}
        {receptionist &&
          a.bookingMode === 'facility' &&
          a.status === 'confirmed' &&
          a.billing.receivedAt &&
          !future(a.date, a.time) && (
            <button onClick={() => open(a, 'completed')}>Đánh dấu đã khám</button>
          )}
        {doctor && a.status === 'confirmed' && a.billing.receivedAt && (
          <Link className="font-bold text-sky-700" to={'/bac-si-lam-viec/kham/' + a.id}>
            Khám
          </Link>
        )}
        {doctor && a.status === 'confirmed' && !a.billing.receivedAt && (
          <span className="text-sm text-slate-500" title="Nhân viên chưa tiếp nhận bệnh nhân">
            Khám · chờ tiếp nhận
          </span>
        )}
        {['pending', 'confirmed'].includes(a.status) &&
          !a.billing.receivedAt &&
          (isAdmin(user) || (patient && future(a.date, a.time))) && (
            <button className="text-red-600!" onClick={() => open(a, 'cancelled')}>
              Hủy lịch
            </button>
          )}
        {isAdmin(user) &&
          a.status === 'confirmed' &&
          !a.billing.receivedAt &&
          !future(a.date, a.time) && <button onClick={() => open(a, 'absent')}>Vắng mặt</button>}
        {(patient || receptionist) && (
          <button onClick={() => setBillingId(a.id)}>Chi phí & BHYT</button>
        )}
        {isAdmin(user) && a.status === 'completed' && (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
            {financialBalance(db, a).settled ? 'Đã thanh toán' : 'Chưa thanh toán'}
          </span>
        )}
        {(patient || doctor) && record && (
          <Link className="font-bold text-sky-700" to={recordBase(user) + '/' + record.id}>
            Xem kết quả →
          </Link>
        )}
        {doctor && (
          <Link to={'/bac-si-lam-viec/ho-so?patientId=' + a.patientId}>Xem hồ sơ bệnh án</Link>
        )}
      </div>
    );
  }
  return (
    <div
      className={
        patient ? 'mx-auto min-h-[55vh] w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8' : ''
      }
    >
      <PageTitle
        title={
          patient
            ? 'Lịch hẹn của tôi'
            : doctor
              ? 'Lịch khám được phân công'
              : user.role === 'staff'
                ? 'Duyệt hồ sơ & tiếp nhận'
                : 'Lịch hẹn & khoản thu'
        }
        description={
          doctor
            ? 'Khám bệnh nhân đã được nhân viên duyệt và tiếp nhận; mở hồ sơ để xem lịch sử toàn hệ thống.'
            : user.role === 'staff'
              ? 'Duyệt thông tin đăng ký và xác nhận bệnh nhân đã đến tại cơ sở của bạn.'
              : 'Thông tin lịch khám, trạng thái và các bước tiếp theo.'
        }
      >
        {patient && (
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50"
            to="/dat-lich"
          >
            + Đặt lịch mới
          </Link>
        )}
      </PageTitle>
      {patient && (
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-px [&>button]:min-h-11 [&>button]:shrink-0 [&>button]:border-b-2 [&>button]:border-transparent [&>button]:px-4 [&>button]:font-semibold [&>button]:text-slate-500">
          <button
            className={period === 'upcoming' ? 'border-sky-600! text-sky-700!' : ''}
            onClick={() => setPeriod('upcoming')}
          >
            Sắp tới
          </button>
          <button
            className={period === 'past' ? 'border-sky-600! text-sky-700!' : ''}
            onClick={() => setPeriod('past')}
          >
            Đã qua
          </button>
        </div>
      )}
      {doctor && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex min-h-9 items-center justify-center rounded-lg bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-200"
            onClick={() => setDate(dateKey())}
          >
            Hôm nay
          </button>
          <button
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50"
            onClick={() => {
              setDate('');
              setStatus('pending');
            }}
          >
            Yêu cầu chờ duyệt
          </button>
          <button
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50"
            onClick={() => {
              setDate('');
              setStatus('');
            }}
          >
            Tất cả lịch
          </button>
        </div>
      )}
      <FilterPanel>
        <Field label={patient ? 'Tìm lịch khám' : 'Tìm bệnh nhân / mã lịch'}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập tên hoặc mã lịch…"
          />
        </Field>
        <Select
          label="Trạng thái"
          value={status}
          onChange={setStatus}
          options={Object.entries(statuses)
            .slice(0, 6)
            .map(([id, name]) => ({ id, name }))}
          placeholder="Tất cả trạng thái"
        />
        <Field label="Ngày khám">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {(patient || user.role === 'superAdmin') && (
          <Select
            label="Cơ sở"
            value={branchId}
            onChange={setBranchId}
            options={db.branches}
            placeholder="Tất cả cơ sở"
          />
        )}
      </FilterPanel>
      <Alert error={!action && error} success={success} />
      {isAdmin(user) ? (
        <Table
          headers={['Lịch khám', 'Người khám', 'Cơ sở / bác sĩ', 'Trạng thái', 'Thao tác']}
          empty={!rows.length}
        >
          {rows.map((a) => (
            <tr key={a.id} data-appointment-id={a.id}>
              <td>
                <strong>
                  {formatDate(a.date)} · {a.time}
                </strong>
                <small className="break-all font-mono text-xs text-slate-600">{a.id}</small>
                <span>{a.serviceName}</span>
                <small>
                  {financialBalance(db, a).patientDue === null
                    ? 'Chờ xác minh BHYT'
                    : money(financialBalance(db, a).patientDue)}
                </small>
              </td>
              <td>
                {a.patientName}
                <small>{a.phone}</small>
              </td>
              <td>
                {name(db, 'branches', a.branchId)}
                <small>{a.doctorId ? name(db, 'doctors', a.doctorId) : 'Không chọn bác sĩ'}</small>
              </td>
              <td>
                <Badge status={a.status} />
                <small>{insuranceStatuses[a.billing.insurance.status]}</small>
                {a.reason && <small>{a.reason}</small>}
              </td>
              <td>{actions(a)}</td>
            </tr>
          ))}
        </Table>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="space-y-4 p-4 sm:p-5">
            {cards.pageItems.map((a) => (
              <article
                className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-[8rem_minmax(0,1fr)]"
                key={a.id}
                data-appointment-id={a.id}
              >
                <div className="flex items-center gap-3 rounded-xl bg-sky-50 p-4 text-sky-800 md:flex-col md:justify-center md:text-center [&_strong]:text-xl">
                  <FiCalendar />
                  <strong>{a.time || 'Chờ giờ'}</strong>
                  <span>{formatDate(a.date)}</span>
                </div>
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-brand-900">
                    <h2>{doctor ? a.patientName : a.serviceName}</h2>
                    <Badge status={a.status} />
                  </div>
                  <p>
                    {doctor
                      ? a.serviceName + ' · ' + a.phone
                      : a.doctorId
                        ? name(db, 'doctors', a.doctorId)
                        : 'Không chọn bác sĩ · nhân viên cơ sở xử lý'}
                  </p>
                  <p>
                    <FiMapPin /> {name(db, 'branches', a.branchId)} ·{' '}
                    {name(db, 'departments', a.departmentId)}
                  </p>
                  <small className="break-all font-mono text-xs text-slate-600">
                    Mã lịch: {a.id}
                  </small>
                  {a.reason && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      {a.reason}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                    <strong>
                      {financialBalance(db, a).patientDue === null
                        ? 'Chờ xác minh BHYT'
                        : money(financialBalance(db, a).patientDue)}
                    </strong>
                    {actions(a)}
                  </div>
                </div>
              </article>
            ))}
            {!rows.length && <Empty text="Không có lịch hẹn phù hợp." />}
          </div>
          <Pagination
            page={cards.page}
            pageCount={cards.pageCount}
            total={rows.length}
            onPage={cards.setPage}
          />
        </div>
      )}
      {billingId && (
        <Modal wide title="Chi phí, BHYT & thanh toán" close={() => setBillingId('')}>
          <BillingPanel appointmentId={billingId} />
        </Modal>
      )}
      {action && (
        <Modal
          title={action.type === 'pay' ? 'Xác nhận thu tiền mô phỏng' : 'Cập nhật lịch hẹn'}
          close={() => setAction(null)}
        >
          <form onSubmit={submit}>
            <p>
              {action.row.patientName} · {formatDate(action.row.date)} · {action.row.time}
            </p>
            <p>{action.type === 'pay' ? money(action.row.price) : statuses[action.type]}</p>
            {action.type === 'confirmed' && action.row.bookingMode === 'facility' && (
              <Field label="Giờ tiếp nhận dự kiến">
                <input name="time" type="time" required />
              </Field>
            )}
            {['rejected', 'cancelled'].includes(action.type) && (
              <Field label="Lý do">
                <textarea name="reason" required={action.type === 'rejected' || isAdmin(user)} />
              </Field>
            )}
            <Alert error={error} />
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50">
              Xác nhận
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
