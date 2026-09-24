import { FiCalendar } from 'react-icons/fi';
import { formatDate } from '../helpers/ClinicalHelpers';

export function RecordSections({ record }) {
  return (
    <div className="space-y-5 [&_section]:rounded-2xl [&_section]:border [&_section]:border-slate-200 [&_section]:bg-white [&_section]:p-5 [&_section]:shadow-sm [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-brand-900">
      {[
        ['Triệu chứng', record.symptoms],
        ['Chẩn đoán', record.diagnosis],
        ['Hướng dẫn & ghi chú', record.notes],
      ].map(([title, value]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>{value || 'Chưa có thông tin'}</p>
        </section>
      ))}
      <section className="border-sky-200! bg-sky-50!">
        <h2>
          <FiCalendar /> Lịch tái khám
        </h2>
        <p>{record.followUp ? formatDate(record.followUp) : 'Chưa có chỉ định ngày tái khám.'}</p>
      </section>
      <section>
        <h2>Đơn thuốc</h2>
        {record.prescription?.length ? (
          <div className="space-y-3">
            {record.prescription.map((item) => (
              <div className="rounded-xl bg-slate-50 p-3" key={item.medicineId}>
                <strong>
                  {item.name} · {item.quantity} {item.unit}
                </strong>
                <p>
                  {item.dosage} · {item.route} · {item.frequency} · {item.duration}
                </p>
                {item.instructions && <small>{item.instructions}</small>}
              </div>
            ))}
            <p className="text-sm text-slate-500">
              Trạng thái:{' '}
              {record.dispenseStatus === 'dispensed'
                ? 'Đã cấp thuốc'
                : record.dispenseStatus === 'cancelled'
                  ? 'Đã hủy cấp thuốc'
                  : 'Đang chờ cấp'}
            </p>
          </div>
        ) : (
          <p>Buổi khám không có thuốc kê đơn.</p>
        )}
      </section>
    </div>
  );
}
