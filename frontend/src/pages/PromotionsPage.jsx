import { useState } from 'react';
import { useHospital } from '../state/context';
import { dateKey, money, relativeDate } from '../data/seed';
import { PageTitle } from '../components/PageTitle';
import { Field } from '../components/Field';
import { Modal } from '../components/Modal';
import { Alert } from '../components/Alert';
import { Empty } from '../components/Empty';

function PromotionEditor({ promotion, close }) {
  const { db, user, dispatch } = useHospital();
  const [form, setForm] = useState(
    promotion || {
      name: '',
      mode: 'code',
      code: '',
      kind: 'fixed',
      value: 50000,
      maxDiscount: 50000,
      minimum: 150000,
      startsOn: dateKey(),
      endsOn: relativeDate(30),
      branchIds: user.role === 'superAdmin' ? [] : [user.branchId],
      serviceIds: [],
      audience: 'all',
      totalLimit: 100,
      perPatientLimit: 1,
      active: true,
    },
  );
  const [error, setError] = useState('');
  const set = (key, value) => setForm({ ...form, [key]: value });
  const toggle = (key, value) =>
    set(
      key,
      form[key].includes(value) ? form[key].filter((v) => v !== value) : [...form[key], value],
    );
  async function submit(e) {
    e.preventDefault();
    try {
      await dispatch('promotion-save', { id: promotion?.id, values: form });
      close();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <form onSubmit={submit}>
      <Field label="Tên chương trình">
        <input value={form.name} onChange={(e) => set('name', e.target.value)} required />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Cách áp dụng">
          <select value={form.mode} onChange={(e) => set('mode', e.target.value)}>
            <option value="code">Khách nhập mã</option>
            <option value="auto">Tự động</option>
          </select>
        </Field>
        {form.mode === 'code' && (
          <Field label="Mã khuyến mãi">
            <input
              value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              required
              maxLength={30}
            />
          </Field>
        )}
        <Field label="Hình thức giảm">
          <select value={form.kind} onChange={(e) => set('kind', e.target.value)}>
            <option value="fixed">Số tiền cố định</option>
            <option value="percent">Phần trăm</option>
          </select>
        </Field>
        <Field label={form.kind === 'percent' ? 'Phần trăm giảm' : 'Số tiền giảm (đ)'}>
          <input
            type="number"
            min="1"
            max={form.kind === 'percent' ? 100 : 1000000000}
            value={form.value}
            onChange={(e) => set('value', e.target.value)}
            required
          />
        </Field>
        {[
          ['maxDiscount', 'Giảm tối đa (đ)', 1],
          ['minimum', 'Tổng dịch vụ tối thiểu (đ)', 0],
          ['totalLimit', 'Tổng lượt', 1],
          ['perPatientLimit', 'Lượt mỗi khách', 1],
        ].map(([key, label, min]) => (
          <Field key={key} label={label}>
            <input
              type="number"
              min={min}
              max="1000000000"
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              required
            />
          </Field>
        ))}
        <Field label="Ngày khám từ">
          <input
            type="date"
            value={form.startsOn}
            onChange={(e) => set('startsOn', e.target.value)}
            required
          />
        </Field>
        <Field label="Ngày khám đến">
          <input
            type="date"
            value={form.endsOn}
            onChange={(e) => set('endsOn', e.target.value)}
            required
          />
        </Field>
        <Field label="Đối tượng">
          <select value={form.audience} onChange={(e) => set('audience', e.target.value)}>
            <option value="all">Tất cả khách hàng</option>
            <option value="new">Chưa có lần khám hoàn tất</option>
          </select>
        </Field>
      </div>
      {user.role === 'superAdmin' && (
        <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-5 [&_legend]:px-2 [&_legend]:font-bold [&_legend]:text-brand-900">
          <legend>Cơ sở áp dụng</legend>
          <p className="text-slate-500">Không chọn cơ sở cụ thể: áp dụng toàn hệ thống.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {db.branches
              .filter((b) => b.active)
              .map((b) => (
                <label
                  className="flex items-start gap-3 text-sm text-slate-700 [&_input]:mt-0.5 [&_input]:size-4 [&_input]:accent-sky-600"
                  key={b.id}
                >
                  <input
                    type="checkbox"
                    checked={form.branchIds.includes(b.id)}
                    onChange={() => toggle('branchIds', b.id)}
                  />
                  {b.name}
                </label>
              ))}
          </div>
        </fieldset>
      )}
      <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-5 [&_legend]:px-2 [&_legend]:font-bold [&_legend]:text-brand-900">
        <legend>Dịch vụ được giảm</legend>
        <p className="text-slate-500">
          Không chọn: tất cả dịch vụ cho phép khuyến mãi. Chỉ giảm phần ngoài phạm vi BHYT.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[...db.serviceCatalog, ...db.packages.map((p) => ({ ...p, id: `package:${p.id}` }))].map(
            (s) => (
              <label
                className="flex items-start gap-3 text-sm text-slate-700 [&_input]:mt-0.5 [&_input]:size-4 [&_input]:accent-sky-600"
                key={s.id}
              >
                <input
                  type="checkbox"
                  checked={form.serviceIds.includes(s.id)}
                  onChange={() => toggle('serviceIds', s.id)}
                />
                {s.name}
              </label>
            ),
          )}
        </div>
      </fieldset>
      <label className="flex items-start gap-3 text-sm text-slate-700 [&_input]:mt-0.5 [&_input]:size-4 [&_input]:accent-sky-600">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => set('active', e.target.checked)}
        />
        Cho phép áp dụng mới
      </label>
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Lịch đã đặt giữ điều khoản cũ. Ngừng chương trình không hủy ưu đãi đã được giữ cho khách.
      </p>
      <Alert error={error} />
      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50">
        Lưu chương trình
      </button>
    </form>
  );
}

export function PromotionsPage() {
  const { db, user } = useHospital();
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const rows = db.promotions.filter(
    (p) =>
      (user.role === 'superAdmin' || !p.branchIds.length || p.branchIds.includes(user.branchId)) &&
      `${p.name} ${p.code}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')),
  );
  return (
    <>
      <PageTitle
        title="Khuyến mãi"
        description="Quản lý ưu đãi tự động và mã khách hàng nhập. Mỗi lượt khám áp dụng một chương trình."
      >
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50"
          onClick={() => setEditing({})}
        >
          + Tạo chương trình
        </button>
      </PageTitle>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900">
        <Field label="Tìm chương trình / mã">
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((p) => {
          const uses = db.promotionUses.filter((u) => u.promotionId === p.id);
          const editable =
            user.role === 'superAdmin' ||
            (p.branchIds.length === 1 && p.branchIds[0] === user.branchId);
          return (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900 flex flex-col [&>button]:mt-auto"
              key={p.id}
            >
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                  {p.mode === 'auto' ? 'Tự động' : p.code}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${p.active ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-700'}`}
                >
                  {p.active ? 'Đang bật' : 'Ngừng áp dụng'}
                </span>
              </div>
              <h2>{p.name}</h2>
              <strong className="mb-3 block text-3xl font-bold text-sky-700">
                {p.kind === 'percent' ? `${p.value}%` : money(p.value)}
              </strong>
              <p>
                Giảm tối đa {money(p.maxDiscount)} · Tổng dịch vụ từ {money(p.minimum)}
              </p>
              <p className="text-slate-500">
                Ngày khám: {p.startsOn} → {p.endsOn}
                <br />
                {p.branchIds.length
                  ? p.branchIds.map((bid) => db.branches.find((b) => b.id === bid)?.name).join(', ')
                  : 'Toàn hệ thống'}
                <br />
                {p.audience === 'new' ? 'Khách chưa có lần khám hoàn tất' : 'Tất cả khách hàng'}
              </p>
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm [&_dt]:text-slate-500 [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-semibold">
                <dt>Đang giữ</dt>
                <dd>{uses.filter((u) => u.status === 'reserved').length}</dd>
                <dt>Đã dùng</dt>
                <dd>
                  {uses.filter((u) => u.status === 'redeemed').length} / {p.totalLimit}
                </dd>
                <dt>Giới hạn mỗi khách</dt>
                <dd>{p.perPatientLimit}</dd>
              </dl>
              {editable ? (
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 border border-sky-200 bg-white text-sky-700 shadow-none hover:border-sky-300 hover:bg-sky-50"
                  onClick={() => setEditing(p)}
                >
                  Chỉnh sửa chương trình
                </button>
              ) : (
                <small>Chương trình toàn hệ thống do admin tổng quản lý.</small>
              )}
            </article>
          );
        })}
      </div>
      {!rows.length && <Empty text="Chưa có chương trình phù hợp." />}
      {editing && (
        <Modal
          wide
          title={editing.id ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi'}
          close={() => setEditing(null)}
        >
          <PromotionEditor promotion={editing.id ? editing : null} close={() => setEditing(null)} />
        </Modal>
      )}
    </>
  );
}
