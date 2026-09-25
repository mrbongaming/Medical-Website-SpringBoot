import { useState } from 'react';
import { useHospital } from '../state/context';
import { inBranch } from '../data/domain';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';
import { Modal } from '../components/Modal';
import { Select } from '../components/Select';
import { titles } from '../helpers/ManagementHelpers';

export function EntityEditor({ entity, initial, close, saved }) {
  const { db, user, dispatch } = useHospital();
  const [row, setRow] = useState({
    ...initial,
    serviceOpen: initial.serviceHours?.open || '07:30',
    serviceClose: initial.serviceHours?.close || '17:00',
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
  async function submit(e) {
    e.preventDefault();
    const values = { ...row };
    delete values.timesText;
    if (entity === 'branches') {
      values.serviceHours = { open: row.serviceOpen, close: row.serviceClose };
      delete values.serviceOpen;
      delete values.serviceClose;
    }
    if (entity === 'schedules')
      values.times = row.timesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    try {
      await dispatch('save', { entity, id: initial.id, values });
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
        <div className="grid gap-4 md:grid-cols-2">
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
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                {input('serviceOpen', 'Giờ bắt đầu tiếp nhận', 'time', false)}
                {input('serviceClose', 'Giờ kết thúc tiếp nhận', 'time', false)}
              </div>
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
              <Field label="Giới thiệu" wide>
                <textarea value={row.bio || ''} onChange={(e) => change('bio', e.target.value)} />
              </Field>
              <Field label="Đào tạo" wide>
                <textarea
                  value={row.education || ''}
                  onChange={(e) => change('education', e.target.value)}
                />
              </Field>
              <Field label="Quá trình công tác" wide>
                <textarea
                  value={row.career || ''}
                  onChange={(e) => change('career', e.target.value)}
                />
              </Field>
              <Field label="Thành tựu / hoạt động chuyên môn" wide>
                <textarea
                  value={row.achievements || ''}
                  onChange={(e) => change('achievements', e.target.value)}
                />
              </Field>
            </>
          )}
          {entity === 'users' && input('phone', 'Số điện thoại', 'tel')}
          {entity === 'users' && user.role === 'superAdmin' && !initial.id && (
            <Select
              label="Vai trò"
              value={row.role}
              onChange={(value) => change('role', value)}
              options={[
                { id: 'branchAdmin', name: 'Admin cơ sở' },
                { id: 'staff', name: 'Nhân viên tiếp nhận' },
              ]}
              required
            />
          )}
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
              <fieldset className="md:col-span-2">
                <legend>Cơ sở áp dụng</legend>
                {db.branches
                  .filter((b) => b.active)
                  .map((b) => (
                    <label className="flex items-start gap-3 text-sm text-slate-700" key={b.id}>
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
            <label className="flex items-start gap-3 text-sm text-slate-700 md:col-span-2">
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
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-sky-800 hover:bg-sky-50"
            onClick={close}
          >
            Đóng
          </button>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50">
            Lưu dữ liệu
          </button>
        </div>
      </form>
    </Modal>
  );
}
