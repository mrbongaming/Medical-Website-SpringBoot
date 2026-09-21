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
  const [from, setFrom] = useState(dateKey());
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const rows = db[entity]
    .filter(
      (r) =>
        (entity !== 'users' || r.role === 'branchAdmin') &&
        (entity === 'branches'
          ? inBranch(user, r.id)
          : !r.branchId || inBranch(user, r.branchId)) &&
        (!branchId ||
          (entity === 'branches'
            ? r.id === branchId
            : r.branchId === branchId || r.branchIds?.includes(branchId))) &&
        (entity !== 'schedules' || r.date >= from) &&
        normalize(
          (r.name || db.doctors.find((d) => d.id === r.doctorId)?.name || '') +
            ' ' +
            (r.code || ''),
        ).includes(normalize(query)),
    )
    .sort((a, b) => (a.date || a.name || '').localeCompare(b.date || b.name || ''));
  function remove() {
    try {
      dispatch('remove', { entity, id: deleting.id });
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
                role: entity === 'users' ? 'branchAdmin' : undefined,
              })
            }
          >
            + Thêm mới
          </button>
        )}
      </PageTitle>
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
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
      </div>
      <Alert success={success} />
      <Table headers={['Thông tin', 'Chi tiết', 'Trạng thái', 'Thao tác']} empty={!rows.length}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <strong>{row.name || db.doctors.find((d) => d.id === row.doctorId)?.name}</strong>
              <small>{row.code || row.date || row.id}</small>
            </td>
            <td>
              {row.branchId && <span>{db.branches.find((b) => b.id === row.branchId)?.name}</span>}
              {row.specialtyId && (
                <small>{db.specialties.find((s) => s.id === row.specialtyId)?.name}</small>
              )}
              {entity === 'branches' && (
                <>
                  <span>{row.address}</span>
                  <small>
                    {row.hours} · {row.phone}
                  </small>
                </>
              )}
              {row.price && <small>{money(row.price)}</small>}
              {row.times && (
                <div className="flex flex-wrap gap-2 [&>span]:rounded-full [&>span]:bg-slate-100 [&>span]:px-3 [&>span]:py-1 [&>span]:text-sm [&>span]:text-slate-700">
                  {row.times.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              )}
              {entity === 'users' && <small>{row.phone}</small>}
              {row.branchIds && (
                <small>
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
