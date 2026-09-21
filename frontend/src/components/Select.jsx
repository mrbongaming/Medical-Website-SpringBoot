import { Field } from './Field';

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Chọn…',
  required = false,
  disabled = false,
}) {
  return (
    <Field label={label}>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </Field>
  );
}
