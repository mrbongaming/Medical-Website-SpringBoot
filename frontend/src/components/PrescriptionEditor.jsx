import { useMemo, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { availableStock, inventoryRow } from '../data/inventory';
import { normalize } from '../data/domain';
import { money } from '../data/seed';
import { Field } from './Field';

const emptyLine = () => ({
  medicineId: '',
  quantity: 1,
  dosage: '',
  route: 'Đường uống',
  frequency: '',
  duration: '',
  instructions: '',
});

export function PrescriptionEditor({ db, branchId, value, onChange }) {
  const [query, setQuery] = useState('');
  const options = useMemo(
    () =>
      db.medicines
        .filter(
          (m) =>
            m.active &&
            normalize(`${m.code} ${m.name} ${m.activeIngredient}`).includes(normalize(query)),
        )
        .slice(0, 30),
    [db.medicines, query],
  );
  const setLine = (index, key, next) =>
    onChange(value.map((line, i) => (i === index ? { ...line, [key]: next } : line)));
  return (
    <section className="mt-6 space-y-4 border-t border-slate-200 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-brand-900">Đơn thuốc</h2>
          <p className="text-sm text-slate-500">
            Tồn hiển thị là tồn khả dụng tại cơ sở đang khám. Bác sĩ tự nhập hướng dẫn sử dụng.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-100 px-4 font-semibold text-sky-800"
          onClick={() => onChange([...value, emptyLine()])}
        >
          <FiPlus /> Thêm thuốc
        </button>
      </div>
      {!!value.length && (
        <Field label="Tìm nhanh thuốc">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mã, tên hoặc hoạt chất"
          />
        </Field>
      )}
      <div className="space-y-4">
        {value.map((line, index) => {
          const medicine = db.medicines.find((m) => m.id === line.medicineId);
          const stock = inventoryRow(db, branchId, line.medicineId);
          return (
            <fieldset
              className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-3"
              key={index}
            >
              <legend className="px-2 font-semibold text-brand-900">Thuốc {index + 1}</legend>
              <Field label="Thuốc">
                <select
                  value={line.medicineId}
                  onChange={(e) => setLine(index, 'medicineId', e.target.value)}
                  required
                >
                  <option value="">Chọn thuốc</option>
                  {options.map((m) => {
                    const available = availableStock(inventoryRow(db, branchId, m.id));
                    return (
                      <option key={m.id} value={m.id}>
                        {m.code} · {m.name} · còn {available} {m.unit}
                      </option>
                    );
                  })}
                </select>
              </Field>
              <Field label={`Số lượng${medicine ? ` (${medicine.unit})` : ''}`}>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={line.quantity}
                  onChange={(e) => setLine(index, 'quantity', e.target.value)}
                  required
                />
              </Field>
              <Field label="Liều dùng">
                <input
                  value={line.dosage}
                  onChange={(e) => setLine(index, 'dosage', e.target.value)}
                  placeholder="Ví dụ: 1 viên/lần"
                  required
                />
              </Field>
              <Field label="Đường dùng">
                <input
                  value={line.route}
                  onChange={(e) => setLine(index, 'route', e.target.value)}
                  required
                />
              </Field>
              <Field label="Tần suất">
                <input
                  value={line.frequency}
                  onChange={(e) => setLine(index, 'frequency', e.target.value)}
                  placeholder="Ví dụ: 2 lần/ngày"
                  required
                />
              </Field>
              <Field label="Thời gian dùng">
                <input
                  value={line.duration}
                  onChange={(e) => setLine(index, 'duration', e.target.value)}
                  placeholder="Ví dụ: 5 ngày"
                  required
                />
              </Field>
              <Field label="Hướng dẫn thêm">
                <input
                  value={line.instructions}
                  onChange={(e) => setLine(index, 'instructions', e.target.value)}
                />
              </Field>
              <div className="flex items-end justify-between gap-3 md:col-span-2 xl:col-span-2">
                <p className="text-sm text-slate-600">
                  {medicine
                    ? `Khả dụng ${availableStock(stock)} ${medicine.unit} · ${money(medicine.salePrice)}/${medicine.unit}`
                    : 'Chưa chọn thuốc'}
                </p>
                <button
                  type="button"
                  aria-label={`Xóa thuốc ${index + 1}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-semibold text-red-600 hover:bg-red-50"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                >
                  <FiTrash2 /> Xóa
                </button>
              </div>
            </fieldset>
          );
        })}
      </div>
      {!value.length && (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          Buổi khám chưa có thuốc kê đơn.
        </p>
      )}
    </section>
  );
}
