import { scopedAppointments, future, normalize } from '../data/domain';
import { name } from './ClinicalHelpers';

export function getFilteredAppointments(db, user, { period, status, date, branchId, query }) {
  const patient = user.role === 'patient';
  const doctor = user.role === 'doctor';
  return scopedAppointments(db, user)
    .filter(
      (a) =>
        (!status || a.status === status) &&
        (!date || a.date === date) &&
        (!branchId || a.branchId === branchId) &&
        normalize([a.patientName, a.id, name(db, 'doctors', a.doctorId)].join(' ')).includes(
          normalize(query),
        ) &&
        (!patient ||
          (period === 'upcoming'
            ? future(a.date, a.time) && ['pending', 'confirmed'].includes(a.status)
            : !future(a.date, a.time) || !['pending', 'confirmed'].includes(a.status))),
    )
    .sort((a, b) =>
      (patient && period === 'upcoming') || doctor
        ? (a.date + a.time).localeCompare(b.date + b.time)
        : (b.date + b.time).localeCompare(a.date + a.time),
    );
}
