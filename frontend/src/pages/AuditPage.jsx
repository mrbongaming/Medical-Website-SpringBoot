import { useMemo, useState } from 'react';
import { useHospital } from '../state/context';
import { normalize } from '../data/domain';
import { Field } from '../components/Field';
import { PageTitle } from '../components/PageTitle';
import { Select } from '../components/Select';
import { Table } from '../components/Table';

const moduleNames = {
  appointments: 'Lịch hẹn',
  booking: 'Đặt lịch',
  inventory: 'Kho thuốc',
  catalog: 'Danh mục',
  clinical: 'Khám bệnh',
  billing: 'Tài chính',
  content: 'Nội dung',
  system: 'Hệ thống',
};

function actionName(action) {
  return (
    {
      save: 'Lưu danh mục',
      remove: 'Xóa danh mục',
      appointment: 'Đổi trạng thái lịch',
      record: 'Cập nhật bệnh án',
      book: 'Tạo lịch khám',
      'stock-request-create': 'Tạo yêu cầu nhập',
      'stock-request-review': 'Duyệt yêu cầu nhập',
      'stock-request-cancel': 'Hủy yêu cầu nhập',
      'inventory-settings-save': 'Đổi cấu hình kho',
      'medicine-save': 'Cập nhật thuốc',
      'medicine-dispense': 'Cấp thuốc',
      'medicine-cancel': 'Hủy cấp thuốc',
      'content-save': 'Cập nhật nội dung',
    }[action] || action
  );
}

export function AuditPage() {
  const { db, user } = useHospital();
  const [query, setQuery] = useState('');
  const [branchId, setBranchId] = useState('');
  const [module, setModule] = useState('');
  const [severity, setSeverity] = useState('');
  const rows = useMemo(
    () =>
      [...db.auditLogs]
        .filter((row) => user.role === 'superAdmin' || row.branchId === user.branchId)
        .filter((row) => !branchId || row.branchId === branchId)
        .filter((row) => !module || (row.module || 'billing') === module)
        .filter((row) => !severity || (row.severity || 'info') === severity)
        .filter((row) => {
          const actor =
            row.actorName || db.users.find((item) => item.id === row.actorId)?.name || row.actorId;
          return normalize(
            `${actor} ${row.action} ${row.subjectId || ''} ${row.reason || ''}`,
          ).includes(normalize(query));
        })
        .sort((a, b) => b.at.localeCompare(a.at)),
    [branchId, db, module, query, severity, user],
  );
  const clear = () => {
    setQuery('');
    setBranchId('');
    setModule('');
    setSeverity('');
  };
  return (
    <div className="space-y-5">
      <PageTitle
        title={user.role === 'superAdmin' ? 'Nhật ký toàn hệ thống' : 'Nhật ký hoạt động cơ sở'}
        description="Theo dõi các thay đổi nghiệp vụ đã lưu trong dữ liệu demo. Nhật ký này chỉ đọc."
      />
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 xl:items-end">
          <Field label="Tìm kiếm">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Người thực hiện, hành động, mã…"
            />
          </Field>
          {user.role === 'superAdmin' && (
            <Select
              label="Cơ sở"
              value={branchId}
              onChange={setBranchId}
              options={db.branches}
              placeholder="Toàn hệ thống"
            />
          )}
          <Select
            label="Phân hệ"
            value={module}
            onChange={setModule}
            options={Object.entries(moduleNames).map(([id, name]) => ({ id, name }))}
            placeholder="Tất cả phân hệ"
          />
          <Select
            label="Mức độ"
            value={severity}
            onChange={setSeverity}
            options={[
              { id: 'info', name: 'Thông tin' },
              { id: 'warning', name: 'Cảnh báo' },
            ]}
            placeholder="Tất cả mức độ"
          />
          <button
            type="button"
            className="min-h-11 rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 hover:border-sky-400 hover:text-sky-700"
            onClick={clear}
          >
            Xóa bộ lọc
          </button>
        </div>
      </section>
      <Table
        headers={['Thời gian', 'Người thực hiện', 'Hành động', 'Đối tượng', 'Cơ sở', 'Mức độ']}
        empty={!rows.length}
        paginationKey={`${query}|${branchId}|${module}|${severity}`}
      >
        {rows.map((row) => {
          const actor =
            row.actorName || db.users.find((item) => item.id === row.actorId)?.name || row.actorId;
          const branch =
            db.branches.find((item) => item.id === row.branchId)?.name || 'Toàn hệ thống';
          return (
            <tr key={row.id}>
              <td className="whitespace-nowrap">{new Date(row.at).toLocaleString('vi-VN')}</td>
              <td>
                <strong className="block">{actor}</strong>
                <small className="mt-1 block text-slate-500">
                  {row.actorRole || 'Vai trò cũ chưa lưu'}
                </small>
              </td>
              <td>
                <strong className="block">{actionName(row.action)}</strong>
                <small className="mt-1 block text-slate-500">
                  {moduleNames[row.module || 'billing'] || row.module}
                </small>
              </td>
              <td>
                <span className="block font-mono text-xs">
                  {row.subjectId || row.appointmentId || '—'}
                </span>
                {row.reason && (
                  <small className="mt-1 block max-w-72 text-slate-500">{row.reason}</small>
                )}
              </td>
              <td>{branch}</td>
              <td>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${(row.severity || 'info') === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}
                >
                  {(row.severity || 'info') === 'warning' ? 'Cảnh báo' : 'Thông tin'}
                </span>
              </td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
