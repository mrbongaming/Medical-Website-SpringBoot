import { useRef, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useHospital } from '../state/context';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';
import { Modal } from '../components/Modal';
import { Photo } from '../components/Photo';

const emptyBranch = {
  name: '',
  address: '',
  phone: '',
  facilityType: '',
  establishedYear: '',
  email: '',
  website: '',
  image: '/images/hospital.jpg',
  description: '',
  detailedIntroduction: '',
  transportGuide: '',
  accessibility: '',
  serviceOpen: '07:30',
  serviceClose: '17:00',
  equipment: [''],
  amenities: [''],
  active: true,
};

function formState(initial = {}) {
  return {
    ...emptyBranch,
    ...initial,
    establishedYear: initial.establishedYear || '',
    serviceOpen: initial.serviceHours?.open || '07:30',
    serviceClose: initial.serviceHours?.close || '17:00',
    equipment: initial.equipment?.length ? [...initial.equipment] : [''],
    amenities: initial.amenities?.length ? [...initial.amenities] : [''],
  };
}

const uniqueList = (values) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];

function validate(row) {
  const errors = {};
  if (!row.name.trim()) errors.name = 'Nhập tên cơ sở để người dùng có thể nhận biết.';
  if (!row.address.trim()) errors.address = 'Nhập địa chỉ đầy đủ của cơ sở.';
  if (!/^0\d{9,10}$/.test(row.phone.trim()))
    errors.phone = 'Nhập số điện thoại Việt Nam gồm 10–11 chữ số và bắt đầu bằng 0.';
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim()))
    errors.email = 'Nhập email đúng định dạng, ví dụ lienhe@coso.example.';
  if (row.website && !/^https?:\/\/[^\s]+$/i.test(row.website.trim()))
    errors.website = 'Website phải bắt đầu bằng http:// hoặc https://.';
  const year = Number(row.establishedYear);
  if (
    row.establishedYear &&
    (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear())
  )
    errors.establishedYear = `Nhập năm từ 1900 đến ${new Date().getFullYear()}.`;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(row.serviceOpen))
    errors.serviceOpen = 'Chọn giờ bắt đầu tiếp nhận.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(row.serviceClose))
    errors.serviceClose = 'Chọn giờ kết thúc tiếp nhận.';
  if (!errors.serviceOpen && !errors.serviceClose && row.serviceOpen >= row.serviceClose)
    errors.serviceClose = 'Giờ kết thúc phải muộn hơn giờ bắt đầu.';
  if (row.image && !/^(\/|https?:\/\/)/i.test(row.image.trim()))
    errors.image = 'Dùng đường dẫn bắt đầu bằng / hoặc URL http://, https://.';
  return errors;
}

export function BranchEditor({ initial, close, saved }) {
  const { user, dispatch } = useHospital();
  const [row, setRow] = useState(() => formState(initial));
  const initialValue = useRef(JSON.stringify(formState(initial)));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const isNew = !initial.id;
  const dirty = JSON.stringify(row) !== initialValue.current;

  const change = (key, value) => {
    setRow((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
    setError('');
  };

  const requestClose = () => {
    if (dirty && !window.confirm('Bạn có thay đổi chưa lưu. Bạn có muốn đóng biểu mẫu?')) return;
    close();
  };

  const changeList = (key, index, value) =>
    change(
      key,
      row[key].map((item, itemIndex) => (itemIndex === index ? value : item)),
    );

  const addListItem = (key) => change(key, [...row[key], '']);

  const removeListItem = (key, index) => {
    const next = row[key].filter((_, itemIndex) => itemIndex !== index);
    change(key, next.length ? next : ['']);
  };

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    const nextErrors = validate(row);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setError('Kiểm tra lại các trường được đánh dấu bên dưới.');
      const first = Object.keys(nextErrors)[0];
      requestAnimationFrame(() =>
        document.querySelector(`[data-branch-field="${first}"]`)?.focus(),
      );
      return;
    }
    const keepOpen = event.nativeEvent.submitter?.value === 'add-another';
    const values = {
      ...row,
      name: row.name.trim(),
      address: row.address.trim(),
      phone: row.phone.trim(),
      facilityType: row.facilityType.trim(),
      establishedYear: row.establishedYear,
      email: row.email.trim(),
      website: row.website.trim(),
      image: row.image.trim(),
      description: row.description.trim(),
      detailedIntroduction: row.detailedIntroduction.trim(),
      transportGuide: row.transportGuide.trim(),
      accessibility: row.accessibility.trim(),
      equipment: uniqueList(row.equipment),
      amenities: uniqueList(row.amenities),
      serviceHours: { open: row.serviceOpen, close: row.serviceClose },
      hours: `Thứ 2 – Chủ nhật · ${row.serviceOpen} – ${row.serviceClose}`,
    };
    delete values.serviceOpen;
    delete values.serviceClose;
    setSaving(true);
    setError('');
    try {
      const id = await dispatch('save', { entity: 'branches', id: initial.id, values });
      saved({ id, created: isNew, keepOpen });
      if (keepOpen) {
        const next = formState();
        setRow(next);
        initialValue.current = JSON.stringify(next);
        setErrors({});
        setSuccess('Đã lưu cơ sở. Bạn có thể nhập cơ sở tiếp theo.');
      }
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSaving(false);
    }
  }

  const input = (key, label, options = {}) => (
    <Field
      label={label}
      hint={options.hint}
      error={errors[key]}
      required={options.required}
      optional={options.optional}
      wide={options.wide}
    >
      <input
        data-branch-field={key}
        type={options.type || 'text'}
        value={row[key] ?? ''}
        placeholder={options.placeholder}
        min={options.min}
        max={options.max}
        required={options.required}
        aria-invalid={!!errors[key]}
        onChange={(event) => change(key, event.target.value)}
      />
    </Field>
  );

  const textarea = (key, label, options = {}) => (
    <Field label={label} hint={options.hint} optional wide error={errors[key]}>
      <textarea
        data-branch-field={key}
        value={row[key] || ''}
        placeholder={options.placeholder}
        aria-invalid={!!errors[key]}
        onChange={(event) => change(key, event.target.value)}
      />
    </Field>
  );

  const listEditor = (key, title, placeholder, hint) => (
    <fieldset className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
      <legend className="px-2 text-sm font-semibold text-slate-700">
        {title} <span className="font-normal text-slate-500">(Tùy chọn)</span>
      </legend>
      <p className="mb-3 text-sm leading-5 text-slate-500">{hint}</p>
      <div className="space-y-3">
        {row[key].map((item, index) => (
          <div className="flex min-w-0 items-center gap-2" key={`${key}-${index}`}>
            <label className="min-w-0 flex-1">
              <span className="sr-only">
                {title} {index + 1}
              </span>
              <input
                data-testid={`${key}-item-${index}`}
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                value={item}
                placeholder={placeholder}
                onChange={(event) => changeList(key, index, event.target.value)}
              />
            </label>
            <button
              type="button"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 hover:border-red-300 hover:text-red-700"
              aria-label={`Xóa ${title.toLowerCase()} ${index + 1}`}
              onClick={() => removeListItem(key, index)}
            >
              <FiTrash2 />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-sky-200 bg-white px-3 font-semibold text-sky-800 hover:bg-sky-50"
        onClick={() => addListItem(key)}
      >
        <FiPlus /> Thêm {title.toLowerCase()}
      </button>
    </fieldset>
  );

  return (
    <Modal
      title={isNew ? 'Thêm cơ sở trực thuộc' : 'Cập nhật cơ sở trực thuộc'}
      close={requestClose}
      wide
    >
      <form onSubmit={submit} noValidate>
        <p className="mb-5 text-sm leading-6 text-slate-600">
          Các trường có dấu <span className="font-bold text-red-600">*</span> là bắt buộc. Hướng dẫn
          dưới mỗi trường giúp bạn nhập đúng định dạng.
        </p>
        <section aria-labelledby="branch-required-heading">
          <h3 id="branch-required-heading" className="mb-4 text-lg font-bold text-brand-900">
            Thông tin bắt buộc
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {input('name', 'Tên cơ sở', {
              required: true,
              placeholder: 'VD: An Tâm – Chi nhánh Thủ Đức',
              hint: 'Nhập tên giúp phân biệt cơ sở này với các cơ sở khác.',
            })}
            {input('phone', 'Điện thoại', {
              required: true,
              type: 'tel',
              placeholder: 'VD: 02812345678',
              hint: 'Số dùng để tư vấn hoặc đặt lịch khám.',
            })}
            {input('address', 'Địa chỉ', {
              required: true,
              wide: true,
              placeholder: 'Nhập số nhà, tên đường, phường/xã, tỉnh/thành phố',
              hint: 'Nhập địa chỉ đầy đủ để người bệnh dễ tìm.',
            })}
            {input('serviceOpen', 'Giờ bắt đầu tiếp nhận', {
              required: true,
              type: 'time',
              hint: 'Giờ bắt đầu phải sớm hơn giờ kết thúc.',
            })}
            {input('serviceClose', 'Giờ kết thúc tiếp nhận', {
              required: true,
              type: 'time',
              hint: 'Giờ kết thúc phải muộn hơn giờ bắt đầu.',
            })}
          </div>
        </section>

        <section
          className="mt-7 border-t border-slate-200 pt-6"
          aria-labelledby="branch-profile-heading"
        >
          <h3 id="branch-profile-heading" className="mb-4 text-lg font-bold text-brand-900">
            Thông tin giới thiệu
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Loại hình cơ sở"
              optional
              hint="Chọn loại hình gần nhất với phạm vi hoạt động của cơ sở."
            >
              <select
                value={row.facilityType}
                onChange={(event) => change('facilityType', event.target.value)}
              >
                <option value="">Chọn loại hình cơ sở</option>
                <option value="Bệnh viện đa khoa">Bệnh viện đa khoa</option>
                <option value="Phòng khám đa khoa">Phòng khám đa khoa</option>
                <option value="Trung tâm y khoa">Trung tâm y khoa</option>
                {row.facilityType &&
                  !['Bệnh viện đa khoa', 'Phòng khám đa khoa', 'Trung tâm y khoa'].includes(
                    row.facilityType,
                  ) && <option value={row.facilityType}>{row.facilityType}</option>}
              </select>
            </Field>
            {input('establishedYear', 'Năm thành lập', {
              optional: true,
              type: 'number',
              min: 1900,
              max: new Date().getFullYear(),
              placeholder: 'VD: 2015',
              hint: 'Nhập năm gồm bốn chữ số.',
            })}
            {input('email', 'Email', {
              optional: true,
              type: 'email',
              placeholder: 'VD: lienhe@coso.example',
              hint: 'Email dùng để người bệnh liên hệ với cơ sở.',
            })}
            {input('website', 'Website', {
              optional: true,
              type: 'url',
              placeholder: 'VD: https://coso.example',
              hint: 'Đường dẫn phải bắt đầu bằng http:// hoặc https://.',
            })}
            {input('image', 'Đường dẫn ảnh minh họa', {
              optional: true,
              wide: true,
              placeholder: 'VD: /images/hospital.jpg',
              hint: 'Dùng ảnh trong thư mục public hoặc một URL http/https.',
            })}
            <div className="min-w-0 md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Xem trước ảnh</span>
              <Photo
                src={row.image}
                alt="Xem trước ảnh minh họa cơ sở"
                className="h-40 w-full rounded-xl border border-slate-200 object-cover sm:w-72"
              />
            </div>
            {textarea('description', 'Giới thiệu ngắn', {
              placeholder: 'Mô tả ngắn về cơ sở và các dịch vụ nổi bật',
              hint: 'Nội dung này xuất hiện trên danh sách cơ sở.',
            })}
            {textarea('detailedIntroduction', 'Giới thiệu chi tiết', {
              placeholder: 'Nhập thông tin nổi bật, năng lực và phạm vi phục vụ',
              hint: 'Nội dung này xuất hiện trên trang chi tiết cơ sở.',
            })}
          </div>
        </section>

        <section
          className="mt-7 border-t border-slate-200 pt-6"
          aria-labelledby="branch-amenities-heading"
        >
          <h3 id="branch-amenities-heading" className="mb-4 text-lg font-bold text-brand-900">
            Tiện ích và hướng dẫn
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {listEditor(
              'equipment',
              'Trang thiết bị',
              'VD: Máy siêu âm',
              'Nhập mỗi thiết bị hoặc khu chức năng trên một dòng.',
            )}
            {listEditor(
              'amenities',
              'Tiện ích',
              'VD: Khu vực gửi xe',
              'Nhập mỗi tiện ích trên một dòng để dễ chỉnh sửa.',
            )}
            {textarea('transportGuide', 'Hướng dẫn di chuyển và gửi xe', {
              placeholder: 'Mô tả đường đi, vị trí gửi xe hoặc cổng tiếp nhận',
              hint: 'Có thể bổ sung phương tiện công cộng gần nhất.',
            })}
            {textarea('accessibility', 'Hỗ trợ tiếp cận', {
              placeholder: 'VD: Có thang máy và lối đi dành cho xe lăn',
              hint: 'Mô tả hỗ trợ người cao tuổi và người khuyết tật.',
            })}
          </div>
        </section>

        {user.role === 'superAdmin' && (
          <section
            className="mt-7 border-t border-slate-200 pt-6"
            aria-labelledby="branch-status-heading"
          >
            <h3 id="branch-status-heading" className="mb-4 text-lg font-bold text-brand-900">
              Trạng thái hoạt động
            </h3>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 size-5 shrink-0"
                checked={row.active !== false}
                onChange={(event) => change('active', event.target.checked)}
              />
              <span>
                <strong className="block text-slate-900">Đang hoạt động</strong>
                Cơ sở hoạt động được hiển thị công khai và được tính vào tổng số cơ sở kết nối.
              </span>
            </label>
          </section>
        )}

        <Alert error={error} success={success} />
        <div className="sticky -bottom-4 z-10 -mx-4 mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 pb-1 pt-4 sm:-bottom-6 sm:-mx-6 sm:flex-row sm:items-center sm:px-6 sm:pb-0">
          <button
            type="button"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-sky-800 hover:bg-sky-50 sm:w-auto"
            onClick={requestClose}
            disabled={saving}
          >
            Đóng
          </button>
          {isNew && (
            <button
              type="submit"
              value="add-another"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-sky-300 bg-white px-5 py-2.5 font-semibold text-sky-800 hover:bg-sky-50 disabled:opacity-50 sm:w-auto"
              disabled={saving}
            >
              {saving ? 'Đang lưu…' : 'Lưu và thêm tiếp'}
            </button>
          )}
          <button
            type="submit"
            value="save"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
            disabled={saving}
          >
            {saving ? 'Đang lưu…' : 'Lưu dữ liệu'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
