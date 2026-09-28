import { Field } from './Field';

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Chọn…',
  required = false,
  disabled = false,
  hint = '',
  error = '',
  optional = false,
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required} optional={optional}>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
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
