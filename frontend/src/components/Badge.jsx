import { statuses } from '../data/seed';

export function Badge({ status }) {
  const tones = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-sky-100 text-sky-800',
    completed: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-slate-200 text-slate-700',
    absent: 'bg-orange-100 text-orange-800',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${tones[status] || 'bg-slate-100 text-slate-700'}`}
    >
      {statuses[status] || status}
    </span>
  );
}
