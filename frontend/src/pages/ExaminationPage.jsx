import { Link, useParams } from 'react-router-dom';
import { useHospital } from '../state/context';
import { scopedAppointments, future } from '../data/domain';
import { Empty } from '../components/Empty';
import { RecordEditor } from './RecordEditor';

export function ExaminationPage() {
  const { db, user } = useHospital();
  const { appointmentId } = useParams();
  const a = scopedAppointments(db, user).find((a) => a.id === appointmentId);
  if (!a || user.role !== 'doctor' || a.status !== 'confirmed' || future(a.date, a.time))
    return (
      <>
        <Empty text="Lịch khám không tồn tại hoặc chưa được phép ghi kết quả." />
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50"
          to="/bac-si-lam-viec"
        >
          Về lịch khám
        </Link>
      </>
    );
  return <RecordEditor key={a.id} appointment={a} />;
}
