import { useState } from 'react';
import { useHospital } from '../state/context';
import { financialBalance } from '../helpers/PricingHelpers';
import { money } from '../data/seed';
import { Alert } from '../components/Alert';
import { Empty } from '../components/Empty';
import { Field } from '../components/Field';
import { Modal } from '../components/Modal';
import { PageTitle } from '../components/PageTitle';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

export function DispensingPage() {
  const { db, user, dispatch } = useHospital();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cancelId, setCancelId] = useState('');
  const records = db.records.filter(
    (record) =>
      record.branchId === user.branchId &&
      record.prescription?.length &&
      record.dispenseStatus === 'reserved',
  );
  const pages = usePagination(records, 8);
  async function run(type, appointmentId, reason = '') {
    try {
      await dispatch(type, { id: appointmentId, reason });
      setError('');
      setSuccess(
        type === 'medicine-dispense'
          ? 'Đã cấp thuốc và trừ tồn kho.'
          : 'Đã hủy phần cấp thuốc và giải phóng tồn giữ.',
      );
      setCancelId('');
    } catch (e) {
      setError(e.message);
      setSuccess('');
    }
  }
  return (
    <div className="space-y-6">
      <PageTitle
        title="Cấp thuốc"
        description="Đơn thuốc đã hoàn tất khám tại cơ sở; cấp toàn bộ sau khi thanh toán."
      />
      <Alert error={error} success={success} />
      <div className="grid gap-4 lg:grid-cols-2">
        {pages.pageItems.map((record) => {
          const appointment = db.appointments.find((a) => a.id === record.appointmentId);
          const balance = financialBalance(db, appointment);
          return (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              key={record.id}
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-brand-900">{appointment.patientName}</h2>
                  <small>
                    {appointment.id} · {appointment.date}
                  </small>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  {balance.settled
                    ? 'Đã thanh toán'
                    : appointment.billing.finalized
                      ? 'Chờ thanh toán'
                      : 'Chưa chốt phí'}
                </span>
              </div>
              <ul className="my-4 space-y-2">
                {record.prescription.map((item) => (
                  <li className="rounded-xl bg-slate-50 p-3" key={item.medicineId}>
                    <strong>
                      {item.name} · {item.quantity} {item.unit}
                    </strong>
                    <small className="block">
                      {item.dosage} · {item.route} · {item.frequency} · {item.duration}
                    </small>
                    {item.instructions && <small className="block">{item.instructions}</small>}
                    <small className="block text-slate-500">
                      {money(item.unitPrice * item.quantity)}
                    </small>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <button
                  className="inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:opacity-50"
                  disabled={!balance.settled}
                  onClick={() => run('medicine-dispense', appointment.id)}
                >
                  Xác nhận cấp toàn bộ
                </button>
                <button
                  className="inline-flex min-h-11 items-center rounded-xl bg-red-50 px-4 font-semibold text-red-700 disabled:opacity-50"
                  disabled={!!appointment.billing.finalized || balance.settled}
                  onClick={() => setCancelId(appointment.id)}
                >
                  Hủy phần cấp thuốc
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <Pagination
        page={pages.page}
        pageCount={pages.pageCount}
        total={records.length}
        onPage={pages.setPage}
      />
      {!records.length && <Empty text="Không có đơn thuốc đang chờ cấp tại cơ sở." />}
      {cancelId && (
        <Modal title="Hủy phần cấp thuốc" close={() => setCancelId('')}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run('medicine-cancel', cancelId, new FormData(e.currentTarget).get('reason'));
            }}
          >
            <Field label="Lý do hủy">
              <textarea name="reason" required />
            </Field>
            <button className="inline-flex min-h-11 items-center rounded-xl bg-red-600 px-4 font-semibold text-white">
              Xác nhận hủy và giải phóng tồn giữ
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
