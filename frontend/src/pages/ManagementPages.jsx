import { useState } from 'react';
import { useHospital } from '../state/context';
import { inBranch, normalize } from '../data/domain';
import { dateKey, money } from '../data/seed';
import { Alert, Field, Modal, PageTitle, Select, Table } from '../components/UI';

const titles = {
  branches: 'Cơ sở trực thuộc',
  departments: 'Khoa / phòng',
  doctors: 'Đội ngũ bác sĩ',
  schedules: 'Lịch làm việc',
  users: 'Admin cơ sở',
  specialties: 'Danh mục chuyên khoa',
  packages: 'Gói khám sức khỏe',
};
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
            className="button"
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
      <div className="filters">
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
                <div className="chips">
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
              <span className={'badge ' + (row.active === false ? 'cancelled' : 'completed')}>
                {row.active === false ? 'Ngừng hoạt động' : 'Hoạt động'}
              </span>
            </td>
            <td>
              <div className="table-actions">
                <button onClick={() => setEditing(row)}>Sửa</button>
                {!(entity === 'branches' && user.role !== 'superAdmin') && (
                  <button
                    className="danger-text"
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
          <button className="button danger" onClick={remove}>
            Xác nhận xóa
          </button>
        </Modal>
      )}
    </>
  );
}
function EntityEditor({ entity, initial, close, saved }) {
  const { db, user, dispatch } = useHospital();
  const [row, setRow] = useState({
    ...initial,
    timesText: initial.times?.join(', ') || '08:00, 09:00, 10:00, 13:30, 14:30, 15:30',
  });
  const [error, setError] = useState('');
  const change = (key, value) =>
    setRow((r) => ({
      ...r,
      [key]: value,
      ...(key === 'branchId' ? { doctorId: '', departmentId: '' } : {}),
    }));
  function input(key, label, type = 'text', required = true) {
    return (
      <Field key={key} label={label}>
        <input
          type={type}
          value={row[key] ?? ''}
          onChange={(e) => change(key, e.target.value)}
          required={required}
          min={type === 'number' ? 0 : undefined}
        />
      </Field>
    );
  }
  function submit(e) {
    e.preventDefault();
    const values = { ...row };
    delete values.timesText;
    if (entity === 'schedules')
      values.times = row.timesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    try {
      dispatch('save', { entity, id: initial.id, values });
      saved();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <Modal
      title={(initial.id ? 'Cập nhật ' : 'Thêm ') + titles[entity].toLowerCase()}
      close={close}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          {entity !== 'schedules' && input('name', 'Tên')}
          {['departments', 'doctors', 'schedules', 'users'].includes(entity) && (
            <Select
              label="Cơ sở"
              value={row.branchId}
              onChange={(v) => change('branchId', v)}
              options={db.branches.filter((b) => b.active && inBranch(user, b.id))}
              required
              disabled={!!initial.id || user.role !== 'superAdmin'}
            />
          )}
          {entity === 'branches' && (
            <>
              {input('address', 'Địa chỉ')}
              {input('phone', 'Điện thoại', 'tel')}
              {input('hours', 'Giờ hoạt động')}
              {input('image', 'Đường dẫn ảnh minh họa', 'text', false)}
              <Field label="Giới thiệu" wide>
                <textarea
                  value={row.description || ''}
                  onChange={(e) => change('description', e.target.value)}
                />
              </Field>
            </>
          )}
          {['departments', 'packages'].includes(entity) && (
            <Select
              label="Chuyên khoa"
              value={row.specialtyId}
              onChange={(v) => change('specialtyId', v)}
              options={db.specialties.filter((s) => s.active)}
              required
            />
          )}
          {entity === 'doctors' && (
            <>
              <Select
                label="Khoa / phòng"
                value={row.departmentId}
                onChange={(v) => change('departmentId', v)}
                options={db.departments.filter((d) => d.active && d.branchId === row.branchId)}
                required
              />
              {input('price', 'Phí khám (VND)', 'number')}
              {input('experience', 'Năm kinh nghiệm', 'number', false)}
              {input('qualification', 'Học vị / chức danh', 'text', false)}
              {input('expertise', 'Chuyên môn', 'text', false)}
              {input('contactPhone', 'Số liên hệ đặt khám', 'tel', false)}
              {input('image', 'Đường dẫn ảnh minh họa', 'text', false)}
              <Field label="Giới thiệu">
                <textarea value={row.bio || ''} onChange={(e) => change('bio', e.target.value)} />
              </Field>
            </>
          )}
          {entity === 'users' && input('phone', 'Số điện thoại', 'tel')}
          {entity === 'schedules' && (
            <>
              <Select
                label="Bác sĩ"
                value={row.doctorId}
                onChange={(v) => change('doctorId', v)}
                options={db.doctors.filter((d) => d.active && d.branchId === row.branchId)}
                required
              />
              {input('date', 'Ngày', 'date')}
              <Field label="Khung giờ cách nhau bằng dấu phẩy" wide>
                <input
                  value={row.timesText}
                  onChange={(e) => change('timesText', e.target.value)}
                  required
                  placeholder="08:00, 09:00, 14:00"
                />
              </Field>
            </>
          )}
          {entity === 'packages' && (
            <>
              {input('price', 'Giá gói (VND)', 'number')}
              <Field label="Nội dung gói">
                <textarea
                  value={row.contents || ''}
                  onChange={(e) => change('contents', e.target.value)}
                  required
                />
              </Field>
              <fieldset className="wide">
                <legend>Cơ sở áp dụng</legend>
                {db.branches
                  .filter((b) => b.active)
                  .map((b) => (
                    <label className="check" key={b.id}>
                      <input
                        type="checkbox"
                        checked={row.branchIds?.includes(b.id) || false}
                        onChange={(e) =>
                          change(
                            'branchIds',
                            e.target.checked
                              ? [...(row.branchIds || []), b.id]
                              : row.branchIds.filter((id) => id !== b.id),
                          )
                        }
                      />
                      {b.name}
                    </label>
                  ))}
              </fieldset>
            </>
          )}
          {entity !== 'schedules' && !(entity === 'branches' && user.role !== 'superAdmin') && (
            <label className="check wide">
              <input
                type="checkbox"
                checked={row.active !== false}
                onChange={(e) => change('active', e.target.checked)}
              />
              Đang hoạt động
            </label>
          )}
        </div>
        <Alert error={error} />
        <div className="actions form-actions">
          <button type="button" className="button outline" onClick={close}>
            Đóng
          </button>
          <button className="button">Lưu dữ liệu</button>
        </div>
      </form>
    </Modal>
  );
}
export function SystemPage() {
  const { reset } = useHospital();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  return (
    <>
      <PageTitle title="Dữ liệu demo" />
      <div className="panel">
        <h2>Khôi phục dữ liệu ban đầu</h2>
        <p>
          Tạo lại toàn bộ cơ sở, tài khoản, lịch hẹn, khoản thu mẫu. Các thay đổi cục bộ sẽ được
          thay thế, các tab đang mở được đồng bộ.
        </p>
        <button className="button danger" onClick={() => setConfirm(true)}>
          Khôi phục dữ liệu
        </button>
        <Alert success={success} />
      </div>
      {confirm && (
        <Modal title="Xác nhận khôi phục" close={() => setConfirm(false)}>
          <p>Tất cả thay đổi trên trình duyệt này sẽ mất. Bạn muốn trở về bộ dữ liệu mẫu?</p>
          <Alert error={error} />
          <button
            className="button danger"
            onClick={() => {
              try {
                reset();
                setConfirm(false);
                setSuccess('Đã khôi phục dữ liệu mẫu.');
              } catch (e) {
                setError(e.message);
              }
            }}
          >
            Xác nhận khôi phục
          </button>
        </Modal>
      )}
    </>
  );
}
