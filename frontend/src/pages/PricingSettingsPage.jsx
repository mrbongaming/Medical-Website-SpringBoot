import { useMemo, useState } from 'react';
import { useHospital } from '../state/context';
import { money } from '../helpers/FormatHelpers';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';
import { PageTitle } from '../components/PageTitle';

export function PricingSettingsPage() {
  const { db, dispatch } = useHospital();
  const initialOverrides = useMemo(() => db.pricingSettings?.doctorOverrides || {}, [db]);
  const [doctorSelectionFee, setDoctorSelectionFee] = useState(
    db.pricingSettings?.doctorSelectionFee || 100000,
  );
  const [doctorOverrides, setDoctorOverrides] = useState(initialOverrides);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit(event) {
    event.preventDefault();
    try {
      await dispatch('pricing-settings-save', { doctorSelectionFee, doctorOverrides, reason });
      setError('');
      setSuccess('Đã cập nhật phụ phí chọn bác sĩ cho các lịch tạo mới.');
      setReason('');
    } catch (e) {
      setSuccess('');
      setError(e.message);
    }
  }

  return (
    <>
      <PageTitle
        title="Cấu hình giá đặt khám"
        description="Admin tổng quản lý phụ phí chọn bác sĩ. Lịch đã tạo giữ nguyên bản giá."
      />
      <form className="space-y-6" onSubmit={submit}>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-xl font-bold text-brand-900">Mức phí mặc định</h2>
          <Field label="Phụ phí chọn bác sĩ (VND)">
            <input
              type="number"
              min="1"
              step="1000"
              value={doctorSelectionFee}
              onChange={(event) => setDoctorSelectionFee(event.target.value)}
              required
            />
          </Field>
          <p className="mt-2 text-sm text-slate-500">
            Người bệnh không chọn bác sĩ không trả khoản này. Hiện tại:{' '}
            {money(Number(doctorSelectionFee) || 0)}.
          </p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-xl font-bold text-brand-900">Mức riêng theo bác sĩ</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {db.doctors.map((doctor) => (
              <Field key={doctor.id} label={doctor.name}>
                <input
                  type="number"
                  min="1"
                  step="1000"
                  value={doctorOverrides[doctor.id] || ''}
                  placeholder={String(doctorSelectionFee)}
                  onChange={(event) =>
                    setDoctorOverrides((current) => ({
                      ...current,
                      [doctor.id]: event.target.value,
                    }))
                  }
                />
              </Field>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <Field label="Lý do thay đổi">
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} required />
          </Field>
          <Alert error={error} success={success} />
          <button className="mt-4 min-h-11 rounded-xl bg-sky-600 px-5 font-semibold text-white">
            Lưu cấu hình giá
          </button>
        </section>
      </form>
    </>
  );
}
