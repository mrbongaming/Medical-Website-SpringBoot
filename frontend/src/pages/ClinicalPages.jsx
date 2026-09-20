import { useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiFileText, FiMapPin } from 'react-icons/fi';
import { useHospital } from '../state/context';
import {
  accessibleRecords,
  scopedAppointments,
  isAdmin,
  inBranch,
  future,
  normalize,
} from '../data/domain';
import { statuses, money, dateKey } from '../data/seed';
import {
  Alert,
  Badge,
  Empty,
  Field,
  FilterPanel,
  Modal,
  PageTitle,
  Select,
  Table,
} from '../components/UI';

const formatDate = (date) => new Date(date + 'T12:00:00').toLocaleDateString('vi-VN');
const name = (db, collection, id) =>
  db[collection].find((r) => r.id === id)?.name || 'Đang cập nhật';
const recordBase = (user) => (user.role === 'patient' ? '/ho-so-kham' : '/bac-si-lam-viec/ho-so');

export function AppointmentsPage() {
  const { db, user, dispatch } = useHospital();
  const patient = user.role === 'patient';
  const doctor = user.role === 'doctor';
  const [period, setPeriod] = useState('upcoming');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState(doctor ? dateKey() : '');
  const [branchId, setBranchId] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [action, setAction] = useState(null);
  const rows = scopedAppointments(db, user)
    .filter(
      (a) =>
        (!status || a.status === status) &&
        (!date || a.date === date) &&
        (!branchId || a.branchId === branchId) &&
        normalize([a.patientName, a.id, name(db, 'doctors', a.doctorId)].join(' ')).includes(
          normalize(query),
        ) &&
        (!patient ||
          (period === 'upcoming'
            ? future(a.date, a.time) && ['pending', 'confirmed'].includes(a.status)
            : !future(a.date, a.time) || !['pending', 'confirmed'].includes(a.status))),
    )
    .sort((a, b) =>
      (patient && period === 'upcoming') || doctor
        ? (a.date + a.time).localeCompare(b.date + b.time)
        : (b.date + b.time).localeCompare(a.date + a.time),
    );
  function open(row, type) {
    setAction({ row, type });
    setError('');
    setSuccess('');
  }
  function submit(e) {
    e.preventDefault();
    try {
      dispatch(action.type === 'pay' ? 'pay' : 'appointment', {
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
      <div className="table-actions">
        {doctor && a.status === 'pending' && (
          <>
            <button onClick={() => open(a, 'confirmed')}>Chấp nhận</button>
            <button className="danger-text" onClick={() => open(a, 'rejected')}>
              Từ chối
            </button>
          </>
        )}
        {doctor && a.status === 'confirmed' && !future(a.date, a.time) && (
          <Link className="primary-action" to={'/bac-si-lam-viec/kham/' + a.id}>
            Ghi kết quả
          </Link>
        )}
        {['pending', 'confirmed'].includes(a.status) &&
          (isAdmin(user) || (patient && future(a.date, a.time))) && (
            <button className="danger-text" onClick={() => open(a, 'cancelled')}>
              Hủy lịch
            </button>
          )}
        {isAdmin(user) && a.status === 'confirmed' && !future(a.date, a.time) && (
          <button onClick={() => open(a, 'absent')}>Vắng mặt</button>
        )}
        {isAdmin(user) &&
          a.status === 'completed' &&
          (db.payments.some((p) => p.appointmentId === a.id) ? (
            <span className="badge completed">Đã thu tiền</span>
          ) : (
            <button onClick={() => open(a, 'pay')}>Thu {money(a.price)}</button>
          ))}
        {(patient || doctor) && record && (
          <Link className="primary-action" to={recordBase(user) + '/' + record.id}>
            Xem kết quả →
          </Link>
        )}
        {doctor && (
          <Link to={'/bac-si-lam-viec/ho-so?patientId=' + a.patientId}>Lịch sử khám →</Link>
        )}
      </div>
    );
  }
  return (
    <div className={patient ? 'container page' : ''}>
      <PageTitle
        title={
          patient ? 'Lịch hẹn của tôi' : doctor ? 'Lịch khám & tiếp nhận' : 'Lịch hẹn & khoản thu'
        }
        description={
          doctor
            ? 'Bắt đầu từ lịch hôm nay. Chọn ngày khác để xem lịch và các yêu cầu đang chờ.'
            : 'Thông tin lịch khám, trạng thái và các bước tiếp theo.'
        }
      >
        {patient && (
          <Link className="button" to="/dat-lich">
            + Đặt lịch mới
          </Link>
        )}
      </PageTitle>
      {patient && (
        <div className="tabs">
          <button
            className={period === 'upcoming' ? 'selected' : ''}
            onClick={() => setPeriod('upcoming')}
          >
            Sắp tới
          </button>
          <button className={period === 'past' ? 'selected' : ''} onClick={() => setPeriod('past')}>
            Đã qua
          </button>
        </div>
      )}
      {doctor && (
        <div className="actions date-shortcuts">
          <button className="button small light" onClick={() => setDate(dateKey())}>
            Hôm nay
          </button>
          <button
            className="button small outline"
            onClick={() => {
              setDate('');
              setStatus('pending');
            }}
          >
            Yêu cầu chờ duyệt
          </button>
          <button
            className="button small outline"
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
                <small className="code">{a.id}</small>
                <span>{a.serviceName}</span>
                <small>{money(a.price)}</small>
              </td>
              <td>
                {a.patientName}
                <small>{a.phone}</small>
              </td>
              <td>
                {name(db, 'branches', a.branchId)}
                <small>{name(db, 'doctors', a.doctorId)}</small>
              </td>
              <td>
                <Badge status={a.status} />
                {a.reason && <small>{a.reason}</small>}
              </td>
              <td>{actions(a)}</td>
            </tr>
          ))}
        </Table>
      ) : (
        <div className="appointment-list">
          {rows.map((a) => (
            <article className="appointment-card" key={a.id} data-appointment-id={a.id}>
              <div className="appointment-date">
                <FiCalendar />
                <strong>{a.time}</strong>
                <span>{formatDate(a.date)}</span>
              </div>
              <div className="appointment-info">
                <div className="appointment-heading">
                  <h2>{doctor ? a.patientName : a.serviceName}</h2>
                  <Badge status={a.status} />
                </div>
                <p>{doctor ? a.serviceName + ' · ' + a.phone : name(db, 'doctors', a.doctorId)}</p>
                <p>
                  <FiMapPin /> {name(db, 'branches', a.branchId)} ·{' '}
                  {name(db, 'departments', a.departmentId)}
                </p>
                <small className="code">Mã lịch: {a.id}</small>
                {a.reason && <p className="notice">{a.reason}</p>}
                <div className="appointment-bottom">
                  <strong>{money(a.price)}</strong>
                  {actions(a)}
                </div>
              </div>
            </article>
          ))}
          {!rows.length && <Empty text="Không có lịch hẹn phù hợp." />}
        </div>
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
            {['rejected', 'cancelled'].includes(action.type) && (
              <Field label="Lý do">
                <textarea name="reason" required={action.type === 'rejected' || isAdmin(user)} />
              </Field>
            )}
            <Alert error={error} />
            <button className="button">Xác nhận</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function RecordSections({ record }) {
  return (
    <div className="record-sections">
      {[
        ['Triệu chứng', record.symptoms],
        ['Chẩn đoán', record.diagnosis],
        ['Hướng dẫn & ghi chú', record.notes],
      ].map(([title, value]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>{value || 'Chưa có thông tin'}</p>
        </section>
      ))}
      <section className="follow-up">
        <h2>
          <FiCalendar /> Lịch tái khám
        </h2>
        <p>{record.followUp ? formatDate(record.followUp) : 'Chưa có chỉ định ngày tái khám.'}</p>
      </section>
    </div>
  );
}

export function RecordsPage() {
  const { db, user } = useHospital();
  const [params, setParams] = useSearchParams();
  const patientId = params.get('patientId') || '';
  const [branchId, setBranchId] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const all = accessibleRecords(db, user);
  const patients = db.users.filter((u) => all.some((r) => r.patientId === u.id));
  const valid = !from || !to || from <= to;
  const rows = valid
    ? all
        .filter(
          (r) =>
            (!patientId || r.patientId === patientId) &&
            (!branchId || r.branchId === branchId) &&
            (!from || r.date >= from) &&
            (!to || r.date <= to) &&
            (!specialtyId ||
              db.appointments.find((a) => a.id === r.appointmentId)?.specialtyId === specialtyId),
        )
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];
  return (
    <div className={user.role === 'patient' ? 'container page' : ''}>
      <PageTitle
        title={user.role === 'patient' ? 'Lịch sử khám của tôi' : 'Hồ sơ bệnh án'}
        description={
          user.role === 'patient'
            ? 'Theo dõi từng lần khám, kết quả và hướng dẫn từ bác sĩ.'
            : 'Lịch sử tại cơ sở của bệnh nhân được phân công cho bạn.'
        }
      />
      <FilterPanel>
        {user.role === 'doctor' && (
          <Select
            label="Bệnh nhân"
            options={patients}
            value={patientId}
            onChange={(v) => setParams(v ? { patientId: v } : {})}
            placeholder="Tất cả bệnh nhân được phép xem"
          />
        )}
        <Select
          label="Cơ sở"
          options={db.branches.filter((b) => all.some((r) => r.branchId === b.id))}
          value={branchId}
          onChange={setBranchId}
          placeholder="Tất cả cơ sở"
        />
        <Select
          label="Chuyên khoa"
          options={db.specialties}
          value={specialtyId}
          onChange={setSpecialtyId}
          placeholder="Tất cả chuyên khoa"
        />
        <Field label="Từ ngày">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Đến ngày">
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </FilterPanel>
      {!valid && <Alert error="Ngày bắt đầu không được sau ngày kết thúc." />}
      <p className="muted">{rows.length} hồ sơ · Mới nhất trước</p>
      <div className="record-timeline">
        {rows.map((r) => (
          <article className="record-item" key={r.id}>
            <div className="timeline-marker">
              <FiFileText />
            </div>
            <div className="panel">
              <div className="appointment-heading">
                <span className="eyebrow">{formatDate(r.date)}</span>
                <Badge status={r.finalized ? 'completed' : 'draft'} />
              </div>
              <h2>
                {user.role === 'doctor'
                  ? name(db, 'users', r.patientId)
                  : r.diagnosis || 'Kết quả khám'}
              </h2>
              <p>
                {name(db, 'doctors', r.doctorId)} · {name(db, 'branches', r.branchId)}
              </p>
              <p className="record-preview">{r.symptoms || 'Chưa nhập triệu chứng'}</p>
              <div className="appointment-bottom">
                <span>
                  {r.followUp ? 'Tái khám: ' + formatDate(r.followUp) : 'Chưa hẹn ngày tái khám'}
                </span>
                <Link className="button small light" to={recordBase(user) + '/' + r.id}>
                  Xem chi tiết →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!rows.length && valid && <Empty text="Chưa có hồ sơ khám phù hợp." />}
    </div>
  );
}

export function RecordDetailPage() {
  const { db, user } = useHospital();
  const { recordId } = useParams();
  const record = accessibleRecords(db, user).find((r) => r.id === recordId);
  if (!record)
    return (
      <div className="container page">
        <Empty text="Không tìm thấy hồ sơ hoặc bạn không có quyền xem." />
        <Link className="button" to={recordBase(user)}>
          Về lịch sử khám
        </Link>
      </div>
    );
  const appointment = db.appointments.find((a) => a.id === record.appointmentId);
  return (
    <div className={user.role === 'patient' ? 'container page' : ''}>
      <Link className="back-link" to={recordBase(user)}>
        <FiArrowLeft /> Lịch sử khám
      </Link>
      <PageTitle
        title="Chi tiết lần khám"
        description={formatDate(record.date) + ' · ' + (appointment?.time || '')}
      >
        <Badge status={record.finalized ? 'completed' : 'draft'} />
      </PageTitle>
      <div className="clinical-layout">
        <section className="panel">
          <RecordSections record={record} />
          {!record.finalized && user.role === 'doctor' && record.doctorId === user.doctorId && (
            <Link className="button" to={'/bac-si-lam-viec/kham/' + record.appointmentId}>
              Tiếp tục ghi kết quả
            </Link>
          )}
        </section>
        <aside className="panel clinical-summary">
          <h2>Thông tin buổi khám</h2>
          <dl className="summary">
            <dt>Người khám</dt>
            <dd>{name(db, 'users', record.patientId)}</dd>
            <dt>Bác sĩ</dt>
            <dd>{name(db, 'doctors', record.doctorId)}</dd>
            <dt>Cơ sở</dt>
            <dd>{name(db, 'branches', record.branchId)}</dd>
            <dt>Chuyên khoa</dt>
            <dd>{name(db, 'specialties', appointment?.specialtyId)}</dd>
            <dt>Mã lịch</dt>
            <dd className="code">{record.appointmentId}</dd>
          </dl>
          <p className="notice">
            {record.finalized
              ? 'Kết quả đã hoàn tất, chỉ được xem.'
              : 'Bản nháp, chưa hiển thị cho bệnh nhân.'}
          </p>
        </aside>
      </div>
    </div>
  );
}

export function ExaminationPage() {
  const { db, user } = useHospital();
  const { appointmentId } = useParams();
  const a = scopedAppointments(db, user).find((a) => a.id === appointmentId);
  if (!a || user.role !== 'doctor' || a.status !== 'confirmed' || future(a.date, a.time))
    return (
      <>
        <Empty text="Lịch khám không tồn tại hoặc chưa được phép ghi kết quả." />
        <Link className="button" to="/bac-si-lam-viec">
          Về lịch khám
        </Link>
      </>
    );
  return <RecordEditor key={a.id} appointment={a} />;
}

function RecordEditor({ appointment }) {
  const { db, user, dispatch } = useHospital();
  const navigate = useNavigate();
  const record = db.records.find((r) => r.appointmentId === appointment.id);
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
      <Link className="back-link" to="/bac-si-lam-viec">
        <FiArrowLeft /> Lịch khám
      </Link>
      <PageTitle
        title={'Khám bệnh · ' + appointment.patientName}
        description={
          formatDate(appointment.date) + ' · ' + appointment.time + ' · ' + appointment.serviceName
        }
      />
      <div className="patient-banner">
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
      <div className="clinical-layout">
        <section className="panel">
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
            <p className="notice">
              Hoàn tất sẽ chuyển kết quả sang chỉ đọc và hiển thị cho bệnh nhân.
            </p>
            <Alert error={error} success={success} />
            <div className="actions form-actions">
              <button className="button outline" value="draft">
                Lưu nháp
              </button>
              <button className="button" value="complete">
                Hoàn tất buổi khám
              </button>
              {dirty && <span className="muted">Có thay đổi chưa lưu</span>}
            </div>
          </form>
        </section>
        <aside className="panel clinical-summary">
          <h2>Lịch sử liên quan</h2>
          <p>Các lần khám của bệnh nhân tại cơ sở bạn được phép xem.</p>
          {history.length ? (
            history.map((r) => (
              <Link className="history-preview" key={r.id} to={'/bac-si-lam-viec/ho-so/' + r.id}>
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
          <div className="actions">
            <button className="button outline" onClick={() => blocker.reset()}>
              Tiếp tục chỉnh sửa
            </button>
            <button
              className="button danger"
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

export function DoctorSchedulePage() {
  const { db, user } = useHospital();
  const [from, setFrom] = useState(dateKey());
  const rows = db.schedules
    .filter((s) => s.doctorId === user.doctorId && inBranch(user, s.branchId) && s.date >= from)
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <PageTitle
        title="Lịch làm việc của tôi"
        description="Lịch khám được cơ sở sắp xếp và cập nhật."
      />
      <div className="filters">
        <Field label="Từ ngày">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
      </div>
      <div className="grid three">
        {rows.map((s) => (
          <article className="panel" key={s.id}>
            <h2>
              <FiCalendar /> {formatDate(s.date)}
            </h2>
            <p>{name(db, 'branches', s.branchId)}</p>
            <div className="chips">
              {s.times.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
      {!rows.length && <Empty />}
    </>
  );
}
