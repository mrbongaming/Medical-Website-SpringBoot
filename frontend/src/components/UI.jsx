import { useEffect, useId, useRef, useState } from 'react';
import { statuses } from '../data/seed';

export function FilterPanel({ children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="filter-panel">
      <button
        type="button"
        className="button outline filter-toggle"
        aria-controls={id}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? 'Thu gọn bộ lọc' : 'Tìm kiếm & lọc kết quả'}{' '}
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      <div id={id} className={'filters collapsible-filters' + (open ? ' open' : '')}>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, wide = false }) {
  return (
    <label className={'field' + (wide ? ' wide' : '')}>
      <span>{label}</span>
      {children}
    </label>
  );
}
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
export function Badge({ status }) {
  return <span className={'badge ' + status}>{statuses[status] || status}</span>;
}
export function Empty({ text = 'Chưa có dữ liệu phù hợp.' }) {
  return (
    <div className="empty">
      <span>＋</span>
      <h3>{text}</h3>
      <p>Thử thay đổi bộ lọc hoặc tạo dữ liệu mới.</p>
    </div>
  );
}
export function Alert({ error, success }) {
  return (
    <>
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="alert success" role="status">
          {success}
        </p>
      )}
    </>
  );
}
export function PageTitle({ eyebrow = 'BỆNH VIỆN ĐA KHOA AN TÂM', title, description, children }) {
  return (
    <div className="page-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function Table({ headers, children, empty = false }) {
  return empty ? (
    <Empty />
  ) : (
    <div className="table-wrap" tabIndex="0" aria-label="Bảng dữ liệu, có thể cuộn ngang">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
export function Modal({ title, children, close }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-button" onClick={close} aria-label="Đóng">
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Stat({ label, value, note }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}
