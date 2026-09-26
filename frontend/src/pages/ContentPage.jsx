import { useMemo, useState } from 'react';
import { useHospital } from '../state/context';
import { normalize } from '../data/domain';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';
import { Modal } from '../components/Modal';
import { PageTitle } from '../components/PageTitle';
import { Select } from '../components/Select';
import { Table } from '../components/Table';

const statusNames = { draft: 'Bản nháp', published: 'Đã xuất bản', hidden: 'Đã ẩn' };

export function ContentPage() {
  const { db, user, dispatch } = useHospital();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const rows = useMemo(() => {
    const campaigns = db.campaigns
      .filter((row) => user.role === 'superAdmin' || row.branchIds?.includes(user.branchId))
      .map((row) => ({ ...row, collection: 'campaigns', typeName: 'Chương trình tháng' }));
    const facts =
      user.role === 'superAdmin'
        ? db.healthFacts.map((row) => ({
            ...row,
            collection: 'healthFacts',
            typeName: 'Kiến thức y tế',
          }))
        : [];
    return [...campaigns, ...facts].filter(
      (row) =>
        (!status || row.status === status) &&
        normalize(`${row.title} ${row.summary || row.content || ''}`).includes(normalize(query)),
    );
  }, [db, query, status, user]);
  return (
    <div className="space-y-5">
      <PageTitle
        title="Nội dung công khai"
        description="Quản lý chương trình sức khỏe và kiến thức hiển thị trên website."
      />
      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_16rem_auto] md:items-end">
        <Field label="Tìm nội dung">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tiêu đề hoặc nội dung…"
          />
        </Field>
        <Select
          label="Trạng thái"
          value={status}
          onChange={setStatus}
          options={Object.entries(statusNames).map(([id, name]) => ({ id, name }))}
          placeholder="Tất cả trạng thái"
        />
        <button
          type="button"
          className="min-h-11 rounded-xl border border-slate-300 px-4 font-semibold text-slate-700"
          onClick={() => {
            setQuery('');
            setStatus('');
          }}
        >
          Xóa bộ lọc
        </button>
      </section>
      <Alert error={error} success={success} />
      <Table
        headers={['Nội dung', 'Loại', 'Phạm vi', 'Trạng thái', 'Thao tác']}
        empty={!rows.length}
        paginationKey={`${query}|${status}`}
      >
        {rows.map((row) => {
          const editable =
            user.role === 'superAdmin' ||
            (row.branchIds?.length === 1 && row.branchIds[0] === user.branchId);
          return (
            <tr key={`${row.collection}-${row.id}`}>
              <td className="min-w-80">
                <strong className="block">{row.title}</strong>
                <small className="mt-1 block max-w-xl leading-5 text-slate-500">
                  {row.summary || row.content}
                </small>
              </td>
              <td>{row.typeName}</td>
              <td>{row.branchIds?.length ? `${row.branchIds.length} cơ sở` : 'Toàn hệ thống'}</td>
              <td>
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                  {statusNames[row.status]}
                </span>
              </td>
              <td>
                {editable ? (
                  <button
                    className="font-semibold text-sky-700"
                    onClick={() => {
                      setEditing(row);
                      setError('');
                    }}
                  >
                    Chỉnh sửa
                  </button>
                ) : (
                  <small className="text-slate-500">Chỉ xem</small>
                )}
              </td>
            </tr>
          );
        })}
      </Table>
      {editing && (
        <Modal title="Chỉnh sửa nội dung" close={() => setEditing(null)}>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const values = Object.fromEntries(new FormData(event.currentTarget));
              try {
                await dispatch('content-save', {
                  collection: editing.collection,
                  id: editing.id,
                  values,
                });
                setEditing(null);
                setSuccess('Đã cập nhật nội dung công khai.');
              } catch (caught) {
                setError(caught.message);
              }
            }}
          >
            <Field label="Tiêu đề">
              <input name="title" defaultValue={editing.title} required />
            </Field>
            <Field label={editing.collection === 'campaigns' ? 'Mô tả' : 'Nội dung'}>
              <textarea
                name={editing.collection === 'campaigns' ? 'summary' : 'content'}
                defaultValue={editing.summary || editing.content}
                required
              />
            </Field>
            <Select
              label="Trạng thái"
              value={editing.status}
              onChange={(value) => setEditing({ ...editing, status: value })}
              options={Object.entries(statusNames).map(([id, name]) => ({ id, name }))}
              required
            />
            <input type="hidden" name="status" value={editing.status} />
            <Alert error={error} />
            <button className="min-h-11 rounded-xl bg-sky-700 px-5 font-semibold text-white hover:bg-sky-800">
              Lưu nội dung
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
