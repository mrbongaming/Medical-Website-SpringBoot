import { useHospital } from '../state/context';

export function Rating({ doctorId }) {
  const { db } = useHospital();
  const scores = db.appointments.filter(
    (a) =>
      a.doctorId === doctorId &&
      a.status === 'completed' &&
      Number.isInteger(a.rating) &&
      a.rating >= 1 &&
      a.rating <= 5,
  );
  if (!scores.length) return <span className="text-sm text-slate-400">Chưa có đánh giá</span>;
  const average = scores.reduce((sum, a) => sum + a.rating, 0) / scores.length;
  return (
    <span
      data-testid="rating"
      className="inline-flex flex-wrap items-center gap-1 text-sm text-slate-700 [&>span:first-child]:text-amber-400"
      aria-label={`${average.toFixed(1)} trên 5 sao, ${scores.length} lượt đánh giá`}
    >
      <span aria-hidden="true">★</span> <strong>{average.toFixed(1)}/5</strong>{' '}
      <span className="text-slate-500">({scores.length} lượt đánh giá)</span>
    </span>
  );
}
