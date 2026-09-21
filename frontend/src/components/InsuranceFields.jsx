import { Field } from './Field';

export function InsuranceFields({
  value = {},
  onChange,
  supported = true,
  required = true,
  allowToggle = true,
}) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  return (
    <fieldset
      data-testid="insurance-fields"
      className="space-y-4 rounded-2xl border border-slate-200 p-5 [&_legend]:px-2 [&_legend]:font-bold [&_legend]:text-brand-900"
    >
      <legend>Bảo hiểm y tế</legend>
      {allowToggle && (
        <label className="flex items-start gap-3 text-sm text-slate-700 [&_input]:mt-0.5 [&_input]:size-4 [&_input]:accent-sky-600">
          <input
            type="checkbox"
            checked={!!value.enabled}
            disabled={!supported && !value.enabled}
            onChange={(e) => set('enabled', e.target.checked)}
          />
          Sử dụng BHYT
        </label>
      )}
      {!supported && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Cơ sở hoặc dịch vụ đã chọn chưa hỗ trợ BHYT vào ngày khám này. Bạn có thể đổi lựa chọn
          hoặc bỏ đăng ký BHYT.
        </p>
      )}
      {value.enabled && (
        <>
          <p className="text-slate-500">
            Xác minh BHYT mô phỏng. Chỉ nhập dữ liệu giả; nhân viên sẽ kiểm tra quyền lợi khi tiếp
            nhận.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Mã thẻ / định danh BHYT mẫu">
              <input
                value={value.cardNumber || ''}
                maxLength={15}
                required={required}
                onChange={(e) => set('cardNumber', e.target.value)}
              />
            </Field>
            <Field label="Nơi đăng ký khám ban đầu">
              <input
                value={value.registeredFacility || ''}
                required={required}
                onChange={(e) => set('registeredFacility', e.target.value)}
              />
            </Field>
            <Field label="Có giá trị từ ngày">
              <input
                type="date"
                value={value.validFrom || ''}
                required={required}
                onChange={(e) => set('validFrom', e.target.value)}
              />
            </Field>
            <Field label="Có giá trị đến ngày">
              <input
                type="date"
                value={value.validTo || ''}
                required={required}
                onChange={(e) => set('validTo', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Thông tin chuyển cơ sở (nếu có)">
            <input
              value={value.referral || ''}
              onChange={(e) => set('referral', e.target.value)}
              placeholder="Mã giấy, nơi chuyển và thời hạn — dữ liệu mẫu"
            />
          </Field>
        </>
      )}
    </fieldset>
  );
}
