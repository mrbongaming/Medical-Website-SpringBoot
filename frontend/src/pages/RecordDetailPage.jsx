import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useHospital } from '../state/context';
import { accessibleRecords } from '../data/domain';
import { Badge } from '../components/Badge';
import { Empty } from '../components/Empty';
import { PageTitle } from '../components/PageTitle';
import { formatDate, name, recordBase } from '../helpers/ClinicalHelpers';
import { RecordSections } from './RecordSections';

export function RecordDetailPage() {
  const { db, user } = useHospital();
  const { recordId } = useParams();
  const record = accessibleRecords(db, user).find((r) => r.id === recordId);
  if (!record)
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[55vh] py-10 sm:py-14">
        <Empty text="Không tìm thấy hồ sơ hoặc bạn không có quyền xem." />
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50"
          to={recordBase(user)}
        >
          Về lịch sử khám
        </Link>
      </div>
    );
  const appointment = db.appointments.find((a) => a.id === record.appointmentId);
  return (
    <div
      className={
        user.role === 'patient'
          ? 'mx-auto min-h-[55vh] w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8'
          : ''
      }
    >
      <Link
        className="mb-5 inline-flex items-center gap-2 font-semibold text-sky-700"
        to={recordBase(user)}
      >
        <FiArrowLeft /> Lịch sử khám
      </Link>
      <PageTitle
        title="Chi tiết lần khám"
        description={formatDate(record.date) + ' · ' + (appointment?.time || '')}
      >
        <Badge status={record.finalized ? 'completed' : 'draft'} />
      </PageTitle>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900">
          <RecordSections record={record} />
          {!record.finalized && user.role === 'doctor' && record.doctorId === user.doctorId && (
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50"
              to={'/bac-si-lam-viec/kham/' + record.appointmentId}
            >
              Tiếp tục ghi kết quả
            </Link>
          )}
        </section>
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900 space-y-4">
          <h2>Thông tin buổi khám</h2>
          <dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-[8rem_minmax(0,1fr)] [&_dt]:text-slate-500 [&_dd]:m-0 [&_dd]:min-w-0 [&_dd]:break-words [&_dd]:font-semibold [&_dd]:text-slate-800 sm:[&_dd]:text-right">
            <dt>Người khám</dt>
            <dd>{name(db, 'users', record.patientId)}</dd>
            <dt>Bác sĩ</dt>
            <dd>{name(db, 'doctors', record.doctorId)}</dd>
            <dt>Cơ sở</dt>
            <dd>{name(db, 'branches', record.branchId)}</dd>
            <dt>Chuyên khoa</dt>
            <dd>{name(db, 'specialties', appointment?.specialtyId)}</dd>
            <dt>Mã lịch</dt>
            <dd className="break-all font-mono text-xs text-slate-600">{record.appointmentId}</dd>
          </dl>
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {record.finalized
              ? 'Kết quả đã hoàn tất, chỉ được xem.'
              : 'Bản nháp, chưa hiển thị cho bệnh nhân.'}
          </p>
        </aside>
      </div>
    </div>
  );
}
