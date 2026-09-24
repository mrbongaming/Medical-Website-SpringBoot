import { useState } from 'react';
import { useHospital } from '../state/context';
import { dateKey, money } from '../data/seed';
import { PageTitle } from '../components/PageTitle';
import { Field } from '../components/Field';
import { Alert } from '../components/Alert';
import { Modal } from '../components/Modal';

function PolicyEditor({ policy, close }) {
  const { db, dispatch } = useHospital();
  const [form, setForm] = useState({ ...policy, effectiveFrom: dateKey(), note: '' });
  const [error, setError] = useState('');
  const set = (key, value) => setForm({ ...form, [key]: value });
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await dispatch('policy-save', { values: form });
          close();
        } catch (e) {
          setError(e.message);
        }
      }}
    >
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Đây là biểu giá giả lập, không phải biểu giá BHYT pháp định. Phiên bản mới không thay đổi hồ
        sơ đã xác minh.
      </p>
      <label className="flex items-start gap-3 text-sm text-slate-700 [&_input]:mt-0.5 [&_input]:size-4 [&_input]:accent-sky-600">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => set('enabled', e.target.checked)}
        />
        Hỗ trợ BHYT mô phỏng
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Hiệu lực từ">
          <input
            type="date"
            value={form.effectiveFrom}
            onChange={(e) => set('effectiveFrom', e.target.value)}
            required
          />
        </Field>
        <Field label="Hiệu lực đến">
          <input
            type="date"
            value={form.effectiveTo}
            onChange={(e) => set('effectiveTo', e.target.value)}
            required
          />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {db.serviceCatalog.map((s) => (
          <Field key={s.id} label={`Giá BHYT mẫu: ${s.name}`}>
            <input
              type="number"
              min="0"
              max="1000000000"
              required
              value={form.services.find((r) => r.serviceId === s.id)?.tariff || 0}
              onChange={(e) =>
                set('services', [
                  ...form.services.filter((r) => r.serviceId !== s.id),
                  { serviceId: s.id, tariff: e.target.value },
                ])
              }
            />
          </Field>
        ))}
      </div>
      <p className="text-slate-500">
        Giá 0đ nghĩa là dịch vụ không nằm trong phạm vi chi trả của cấu hình này. Gói khám không tự
        động được hưởng BHYT.
      </p>
      <Field label="Lý do ban hành phiên bản">
        <textarea value={form.note} onChange={(e) => set('note', e.target.value)} required />
      </Field>
      <Alert error={error} />
      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50">
        Ban hành phiên bản mới
      </button>
    </form>
  );
}

export function InsuranceSettingsPage() {
  const { db, user, dispatch } = useHospital();
  const [editing, setEditing] = useState(null);
  const [service, setService] = useState(null);
  const [error, setError] = useState('');
  const branches = db.branches.filter((b) => user.role === 'superAdmin' || b.id === user.branchId);
  return (
    <>
      <PageTitle
        title="Cấu hình BHYT"
        description="Quản lý biểu giá và thời gian áp dụng cho từng cơ sở. Toàn bộ quyền lợi tại đây là dữ liệu mô phỏng."
      />
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Nhân viên phải xác minh hiệu lực thẻ, điều kiện khám và mức hưởng theo hồ sơ mẫu. Không có
        kết nối tra cứu hoặc duyệt của BHXH.
      </p>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {branches.map((b) => {
          const versions = db.insurancePolicies
            .filter((p) => p.branchId === b.id)
            .sort((a, b) => b.version - a.version);
          const latest = versions[0] || {
            branchId: b.id,
            enabled: false,
            effectiveFrom: dateKey(),
            effectiveTo: '2099-12-31',
            services: [],
            version: 0,
          };
          return (
            <section
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900"
              key={b.id}
            >
              <h2>{b.name}</h2>
              <p>
                Phiên bản mới nhất: v{latest.version} ·{' '}
                {latest.enabled ? 'Bật hỗ trợ' : 'Tắt hỗ trợ'}
              </p>
              <p className="text-slate-500">
                {latest.effectiveFrom} → {latest.effectiveTo}
              </p>
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm [&_dt]:text-slate-500 [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-semibold">
                {latest.services.map((s) => (
                  <div className="border-t border-slate-100 pt-3" key={s.serviceId}>
                    <dt>{db.serviceCatalog.find((r) => r.id === s.serviceId)?.name}</dt>
                    <dd>{money(s.tariff)}</dd>
                  </div>
                ))}
              </dl>
              {user.role === 'superAdmin' && (
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 border border-sky-200 bg-white text-sky-700 shadow-none hover:border-sky-300 hover:bg-sky-50"
                  onClick={() => setEditing(latest)}
                >
                  Tạo phiên bản cấu hình
                </button>
              )}
              <details>
                <summary>Lịch sử phiên bản ({versions.length})</summary>
                {versions.map((p) => (
                  <p key={p.id}>
                    <strong>v{p.version}</strong> · {p.effectiveFrom} → {p.effectiveTo} ·{' '}
                    {p.enabled ? 'Bật' : 'Tắt'}
                    <small>{p.note}</small>
                  </p>
                ))}
              </details>
            </section>
          );
        })}
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900">
        <h2>Danh mục dịch vụ bổ sung</h2>
        <p className="text-slate-500">
          Đơn giá mẫu dùng khi bác sĩ ghi nhận dịch vụ đã thực hiện. Giá khám chính được quản lý
          theo bác sĩ/gói khám.
        </p>
        <div className="space-y-3">
          {db.serviceCatalog
            .filter((s) => s.id !== 'consultation')
            .map((s) => (
              <div
                className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                key={s.id}
              >
                <span>
                  <strong>{s.name}</strong>
                  <small>
                    {money(s.price)} · {s.active ? 'Đang hoạt động' : 'Ngừng sử dụng'} ·{' '}
                    {s.discountable ? 'Cho phép ưu đãi phần ngoài BHYT' : 'Không khuyến mãi'}
                  </small>
                </span>
                {user.role === 'superAdmin' && (
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 border border-sky-200 bg-white text-sky-700 shadow-none hover:border-sky-300 hover:bg-sky-50"
                    onClick={() => {
                      setService(s);
                      setError('');
                    }}
                  >
                    Sửa đơn giá
                  </button>
                )}
              </div>
            ))}
        </div>
      </section>
      {service && (
        <Modal title={'Đơn giá: ' + service.name} close={() => setService(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const values = Object.fromEntries(new FormData(e.currentTarget));
              try {
                await dispatch('service-save', {
                  id: service.id,
                  ...values,
                  active: values.active === 'on',
                  discountable: values.discountable === 'on',
                });
                setService(null);
              } catch (e) {
                setError(e.message);
              }
            }}
          >
            <Field label="Đơn giá dịch vụ (đ)">
              <input
                name="price"
                type="number"
                min="1"
                max="1000000000"
                defaultValue={service.price}
                required
              />
            </Field>
            <label className="flex items-start gap-3 text-sm text-slate-700 [&_input]:mt-0.5 [&_input]:size-4 [&_input]:accent-sky-600">
              <input name="active" type="checkbox" defaultChecked={service.active} />
              Cho phép sử dụng mới
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-700 [&_input]:mt-0.5 [&_input]:size-4 [&_input]:accent-sky-600">
              <input name="discountable" type="checkbox" defaultChecked={service.discountable} />
              Cho phép khuyến mãi phần ngoài BHYT
            </label>
            <Field label="Lý do đổi đơn giá">
              <textarea name="reason" required />
            </Field>
            <Alert error={error} />
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50">
              Lưu đơn giá
            </button>
          </form>
        </Modal>
      )}
      {editing && (
        <Modal wide title="Phiên bản BHYT mới" close={() => setEditing(null)}>
          <PolicyEditor policy={editing} close={() => setEditing(null)} />
        </Modal>
      )}
    </>
  );
}
