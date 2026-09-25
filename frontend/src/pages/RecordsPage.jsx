import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiFileText } from 'react-icons/fi';
import { useHospital } from '../state/context';
import { accessibleRecords } from '../data/domain';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import { Empty } from '../components/Empty';
import { Field } from '../components/Field';
import { FilterPanel } from '../components/FilterPanel';
import { PageTitle } from '../components/PageTitle';
import { Select } from '../components/Select';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { formatDate, name, recordBase } from '../helpers/ClinicalHelpers';

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
  const pages = usePagination(rows, 8);
  return (
    <div
      className={
        user.role === 'patient'
          ? 'mx-auto min-h-[55vh] w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8'
          : ''
      }
    >
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
      <p className="text-slate-500">{rows.length} hồ sơ · Mới nhất trước</p>
      <div className="space-y-0">
        {pages.pageItems.map((r) => (
          <article
            className="relative ml-4 border-l-2 border-sky-100 pb-8 pl-8 last:pb-0"
            key={r.id}
          >
            <div className="absolute -left-[9px] top-1 size-4 rounded-full border-4 border-white bg-sky-600 ring-2 ring-sky-200">
              <FiFileText />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-brand-900">
                <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
                  {formatDate(r.date)}
                </span>
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
              <p className="mt-4 rounded-xl bg-slate-50 p-4">
                {r.symptoms || 'Chưa nhập triệu chứng'}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                <span>
                  {r.followUp ? 'Tái khám: ' + formatDate(r.followUp) : 'Chưa hẹn ngày tái khám'}
                </span>
                <Link
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 min-h-9 px-4 py-2 text-sm bg-sky-100 text-sky-800 shadow-none hover:bg-sky-200"
                  to={recordBase(user) + '/' + r.id}
                >
                  Xem chi tiết →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      <Pagination
        page={pages.page}
        pageCount={pages.pageCount}
        total={rows.length}
        onPage={pages.setPage}
      />
      {!rows.length && valid && <Empty text="Chưa có hồ sơ khám phù hợp." />}
    </div>
  );
}
