import { useState } from 'react';
import { useHospital } from '../state/context';
import { inBranch, normalize } from '../data/domain';
import { dateKey, money } from '../data/seed';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';
import { Modal } from '../components/Modal';
import { PageTitle } from '../components/PageTitle';
import { Select } from '../components/Select';
import { Table } from '../components/Table';
import { titles } from '../helpers/ManagementHelpers';
import { EntityEditor } from './EntityEditor';

export function ManagementPage({ entity }) {
  const { db, user, dispatch } = useHospital();
  const [query, setQuery] = useState('');
  const [branchId, setBranchId] = useState('');
  const [activeState, setActiveState] = useState('');
  const [from, setFrom] = useState(dateKey());
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const rows = db[entity]
    .filter(
      (r) =>
        (entity !== 'users' ||
          (user.role === 'superAdmin'
            ? ['branchAdmin', 'staff'].includes(r.role)
            : r.role === 'staff')) &&
        (entity === 'branches'
          ? inBranch(user, r.id)
          : !r.branchId || inBranch(user, r.branchId)) &&
        (!branchId ||
          (entity === 'branches'
            ? r.id === branchId
            : r.branchId === branchId || r.branchIds?.includes(branchId))) &&
        (entity !== 'schedules' || r.date >= from) &&
        (!activeState || (activeState === 'active' ? r.active !== false : r.active === false)) &&
        normalize(
          (r.name || db.doctors.find((d) => d.id === r.doctorId)?.name || '') +
            ' ' +
            (r.code || ''),
        ).includes(normalize(query)),
    )
    .sort((a, b) => (a.date || a.name || '').localeCompare(b.date || b.name || ''));
  async function remove() {
    try {
      await dispatch('remove', { entity, id: deleting.id });
      setDeleting(null);
      setError('');
      setSuccess('Đã xóa dữ liệu chưa có liên kết.');
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <PageTitle
        title={titles[entity]}
        description="Thông tin thống nhất theo cơ sở và phạm vi quản lý."
      >
        {!(entity === 'branches' && user.role !== 'superAdmin') && (
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50"
            onClick={() =>
              setEditing({
                branchId: user.branchId || branchId || db.branches.find((b) => b.active)?.id,
                active: true,
                role:
                  entity === 'users'
                    ? user.role === 'superAdmin'
                      ? 'branchAdmin'
                      : 'staff'
                    : undefined,
              })
            }
          >
            + Thêm mới
          </button>
        )}
      </PageTitle>
      <div className="mb-5 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Tìm kiếm">
          <input
            placeholder="Tên hoặc mã…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        {user.role === 'superAdmin' && entity !== 'specialties' && (
          <Select
            label="Cơ sở"
            value={branchId}
            onChange={setBranchId}
            options={db.branches}
            placeholder="Tất cả cơ sở"
          />
        )}
        {entity === 'schedules' && (
          <Field label="Từ ngày">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
        )}
        {entity !== 'schedules' && (
          <Select
            label="Trạng thái"
            value={activeState}
            onChange={setActiveState}
            options={[
              { id: 'active', name: 'Đang hoạt động' },
              { id: 'inactive', name: 'Ngừng hoạt động' },
            ]}
            placeholder="Tất cả trạng thái"
          />
        )}
        {(query || branchId || activeState || (entity === 'schedules' && from !== dateKey())) && (
          <button
            type="button"
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-700 hover:border-sky-400 hover:text-sky-700"
            onClick={() => {
              setQuery('');
              setBranchId('');
              setActiveState('');
              setFrom(dateKey());
            }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
      <Alert success={success} />
      <Table
        headers={['Thông tin', 'Chi tiết', 'Trạng thái', 'Thao tác']}
        empty={!rows.length}
        paginationKey={`${query}|${branchId}|${activeState}|${from}`}
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="min-w-52">
              <strong className="block text-slate-950">
                {row.name || db.doctors.find((d) => d.id === row.doctorId)?.name}
              </strong>
              <small className="mt-1 block text-slate-500">{row.code || row.date || row.id}</small>
            </td>
            <td className="min-w-72">
              {row.branchId && (
                <span className="block font-medium text-slate-800">
                  {db.branches.find((b) => b.id === row.branchId)?.name}
                </span>
              )}
              {row.specialtyId && (
                <small className="mt-1 block text-slate-500">
                  {db.specialties.find((s) => s.id === row.specialtyId)?.name}
                </small>
              )}
              {entity === 'branches' && (
                <>
                  <span className="block leading-6">{row.address}</span>
                  <small className="mt-1 block text-slate-500">
                    {row.hours} · {row.phone}
                  </small>
                </>
              )}
              {row.price && <small className="mt-1 block text-slate-500">{money(row.price)}</small>}
              {row.times && (
                <div className="flex flex-wrap gap-2 [&>span]:rounded-full [&>span]:bg-slate-100 [&>span]:px-3 [&>span]:py-1 [&>span]:text-sm [&>span]:text-slate-700">
                  {row.times.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              )}
              {entity === 'users' && (
                <small className="mt-1 block text-slate-500">{row.phone}</small>
              )}
              {row.branchIds && (
                <small className="mt-1 block text-slate-500">
                  {db.branches
                    .filter((b) => row.branchIds.includes(b.id))
                    .map((b) => b.name)
                    .join(', ')}
                </small>
              )}
            </td>
            <td>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${row.active === false ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'}`}
              >
                {row.active === false ? 'Ngừng hoạt động' : 'Hoạt động'}
              </span>
            </td>
            <td>
              <div className="flex flex-wrap gap-2 [&>a]:text-sm [&>a]:font-semibold [&>a]:text-sky-700 [&>button]:border-0 [&>button]:bg-transparent [&>button]:p-0 [&>button]:text-sm [&>button]:font-semibold [&>button]:text-sky-700">
                <button onClick={() => setEditing(row)}>Sửa</button>
                {!(entity === 'branches' && user.role !== 'superAdmin') && (
                  <button
                    className="text-red-600!"
                    onClick={() => {
                      setDeleting(row);
                      setError('');
                    }}
                  >
                    Xóa
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>
      {editing && (
        <EntityEditor
          entity={entity}
          initial={editing}
          close={() => setEditing(null)}
          saved={() => {
            setEditing(null);
            setSuccess('Đã lưu thay đổi.');
          }}
        />
      )}
      {deleting && (
        <Modal title="Xóa dữ liệu" close={() => setDeleting(null)}>
          <p>
            Xóa {deleting.name || deleting.date}? Dữ liệu đã có liên kết sẽ không được xóa; hãy
            ngừng hoạt động trong biểu mẫu sửa.
          </p>
          <Alert error={error} />
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 bg-red-600 text-white hover:bg-red-700"
            onClick={remove}
          >
            Xác nhận xóa
          </button>
        </Modal>
      )}
    </>
  );
}
