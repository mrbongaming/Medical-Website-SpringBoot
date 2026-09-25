import { Link, useSearchParams } from 'react-router-dom';
import { FiArrowRight, FiActivity } from 'react-icons/fi';
import { useHospital } from '../state/context';
import { money } from '../data/seed';
import { normalize } from '../data/domain';
import { Empty } from '../components/Empty';
import { PageTitle } from '../components/PageTitle';
import { Select } from '../components/Select';
import { BranchCard } from '../components/BranchCard';
import { DoctorCard } from '../components/DoctorCard';
import { Pagination } from '../components/Pagination';

export function DirectoryPage({ kind }) {
  const { db } = useHospital();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const branchId = params.get('branchId') || '';
  const specialtyId = params.get('specialtyId') || '';
  const requestedPage = Math.max(1, Number(params.get('page')) || 1);
  const set = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.delete('page');
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
  const pageSize = 9;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize);
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[55vh] py-10 sm:py-14">
      <PageTitle
        title={names[kind]}
        description="Tìm hiểu thông tin, lựa chọn nơi khám và bác sĩ phù hợp với bạn."
      />
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-slate-700 [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-300 [&_input]:bg-white [&_input]:px-3.5 [&_input]:py-2.5 [&_input]:font-normal [&_input]:text-slate-900 [&_input]:shadow-sm [&_input]:transition [&_input]:placeholder:text-slate-400 focus-within:[&_input]:border-sky-500 focus-within:[&_input]:ring-2 focus-within:[&_input]:ring-sky-100 [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-3.5 [&_select]:py-2.5 [&_select]:font-normal [&_select]:text-slate-900 [&_textarea]:min-h-28 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:bg-white [&_textarea]:px-3.5 [&_textarea]:py-2.5 [&_textarea]:font-normal [&_textarea]:text-slate-900">
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
      <p className="text-slate-500">{rows.length} kết quả phù hợp</p>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleRows.map((r) =>
          kind === 'branches' ? (
            <BranchCard key={r.id} branch={r} />
          ) : kind === 'doctors' ? (
            <DoctorCard key={r.id} doctor={r} />
          ) : (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900"
              key={r.id}
            >
              <span className="grid size-12 place-items-center rounded-xl bg-sky-100 text-2xl text-sky-700">
                <FiActivity />
              </span>
              <h2>{r.name}</h2>
              <p>{r.contents || 'Thăm khám và tư vấn cùng đội ngũ bác sĩ An Tâm.'}</p>
              {r.price && <h3>{money(r.price)}</h3>}
              <div className="flex flex-wrap gap-2">
                <Link
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-sky-800 hover:bg-sky-50"
                  to={kind === 'packages' ? '/goi-kham/' + r.slug : '/bac-si?specialtyId=' + r.id}
                >
                  {kind === 'packages' ? 'Xem chi tiết' : 'Tìm bác sĩ'} <FiArrowRight />
                </Link>
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-sky-700 px-4 py-2 font-semibold text-white hover:bg-sky-800"
                  to={
                    kind === 'packages'
                      ? '/dat-lich?packageId=' + r.id
                      : '/dat-lich?specialtyId=' + r.id + '&bookingMode=facility'
                  }
                >
                  {kind === 'packages' ? 'Đặt gói' : 'Đặt không chọn bác sĩ'}
                </Link>
              </div>
            </article>
          ),
        )}
      </div>
      {pageCount > 1 && (
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <Pagination
            page={page}
            pageCount={pageCount}
            total={rows.length}
            onPage={(nextPage) => set('page', String(nextPage))}
          />
        </div>
      )}
      {!rows.length && <Empty />}
    </div>
  );
}
