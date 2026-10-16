import { useState } from 'react';
import { useHospital } from '../state/context';
import { money } from '../data/mockData';
import { Alert } from '../components/Alert';
import { Empty } from '../components/Empty';
import { PageTitle } from '../components/PageTitle';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

export function DispensingPage() {
  const { db, user, dispatch } = useHospital();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const records = db.records.filter(
    (record) =>
      record.branchId === user.branchId &&
      record.prescription?.length &&
      record.purchaseChoice === 'hospital' &&
      record.dispenseStatus === 'not_managed',
  );
  const pages = usePagination(records, 8);
  async function run(type, appointmentId, reason = '') {
    try {
      await dispatch(type, { id: appointmentId, reason });
      setError('');
      setSuccess('Đã ghi nhận bệnh nhân chọn mua thuốc tại bệnh viện. Tồn kho không thay đổi.');
    } catch (e) {
      setError(e.message);
      setSuccess('');
    }
  }
  return (
    <div className="space-y-6">
      <PageTitle
        title="Đơn mua thuốc tại bệnh viện"
        description="Ghi nhận lựa chọn mua tại bệnh viện. Trong phạm vi đồ án, thao tác này không giữ hoặc trừ tồn kho."
      />
      <Alert error={error} success={success} />
      <div className="grid gap-4 lg:grid-cols-2">
        {pages.pageItems.map((record) => {
          const appointment = db.appointments.find((a) => a.id === record.appointmentId);
          return (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              key={record.id}
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-brand-900">{appointment.patientName}</h2>
                  <small>
                    {appointment.id} · {appointment.date}
                  </small>
                </div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
                  Không liên kết tồn kho
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
                  onClick={() => run('medicine-purchase-complete', appointment.id)}
                >
                  Ghi nhận mua tại bệnh viện
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
      {!records.length && <Empty text="Không có đơn chọn mua tại bệnh viện đang chờ ghi nhận." />}
    </div>
  );
}
