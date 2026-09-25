import { money } from '../data/seed';
import { Field } from './Field';

export function ServiceEditor({ catalog, value, onChange, reason, onReason, savedItems = [] }) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-5 [&_legend]:px-2 [&_legend]:font-bold [&_legend]:text-brand-900">
      <legend>Dịch vụ đã thực hiện</legend>
      <p className="text-slate-500">
        Phí khám ban đầu được giữ theo lịch. Chỉ ghi nhận dịch vụ bổ sung đã thực hiện và đã trao
        đổi chi phí với người bệnh.
      </p>
      <div className="space-y-3">
        {catalog
          .filter(
            (s) =>
              (s.active || value.some((i) => i.serviceId === s.id)) &&
              s.id !== 'consultation' &&
              !savedItems.some((item) => item.packageServiceId && item.serviceId === s.id),
          )
          .map((s) => {
            const line = value.find((i) => i.serviceId === s.id);
            return (
              <div
                data-testid="service-option"
                className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                key={s.id}
              >
                <label className="flex items-start gap-3 text-sm text-slate-700 [&_input]:mt-0.5 [&_input]:size-4 [&_input]:accent-sky-600">
                  <input
                    type="checkbox"
                    checked={!!line}
                    onChange={(e) =>
                      onChange(
                        e.target.checked
                          ? [...value, { serviceId: s.id, quantity: 1 }]
                          : value.filter((i) => i.serviceId !== s.id),
                      )
                    }
                  />
                  <span>
                    {s.name}
                    <small>
                      {money(savedItems.find((i) => i.serviceId === s.id)?.unitPrice ?? s.price)} /
                      lần{s.active ? '' : ' · Đã ngừng nhận mới'}
                    </small>
                  </span>
                </label>
                {line && (
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 [&_input]:w-20 [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-300 [&_input]:p-2">
                    Số lượng
                    <input
                      aria-label={`Số lượng ${s.name}`}
                      type="number"
                      min="1"
                      max="20"
                      value={line.quantity}
                      onChange={(e) =>
                        onChange(
                          value.map((i) =>
                            i.serviceId === s.id ? { ...i, quantity: e.target.value } : i,
                          ),
                        )
                      }
                    />
                  </label>
                )}
              </div>
            );
          })}
      </div>
      <Field label="Lý do thay đổi dịch vụ so với dự toán">
        <textarea
          value={reason}
          onChange={(e) => onReason(e.target.value)}
          placeholder="Ghi căn cứ chỉ định và việc trao đổi chi phí với người bệnh"
        />
      </Field>
    </fieldset>
  );
}
