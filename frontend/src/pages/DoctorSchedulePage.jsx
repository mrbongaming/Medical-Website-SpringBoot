import { useState } from 'react';
import { FiCalendar } from 'react-icons/fi';
import { useHospital } from '../state/context';
import { inBranch } from '../data/domain';
import { dateKey } from '../data/seed';
import { Empty } from '../components/Empty';
import { Field } from '../components/Field';
import { PageTitle } from '../components/PageTitle';
import { formatDate, name } from '../helpers/ClinicalHelpers';

export function DoctorSchedulePage() {
  const { db, user } = useHospital();
  const [from, setFrom] = useState(dateKey());
  const rows = db.schedules
    .filter((s) => s.doctorId === user.doctorId && inBranch(user, s.branchId) && s.date >= from)
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <PageTitle
        title="Lịch làm việc của tôi"
        description="Lịch khám được cơ sở sắp xếp và cập nhật."
      />
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Từ ngày">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((s) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900"
            key={s.id}
          >
            <h2>
              <FiCalendar /> {formatDate(s.date)}
            </h2>
            <p>{name(db, 'branches', s.branchId)}</p>
            <div className="flex flex-wrap gap-2 [&>span]:rounded-full [&>span]:bg-slate-100 [&>span]:px-3 [&>span]:py-1 [&>span]:text-sm [&>span]:text-slate-700">
              {s.times.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
      {!rows.length && <Empty />}
    </>
  );
}
