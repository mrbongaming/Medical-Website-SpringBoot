import { availableSlots } from './domain.js';

export function initialBooking(db, params, saved = {}) {
  const hasSelection = ['branchId', 'doctorId', 'specialtyId', 'packageId', 'date'].some((key) =>
    params.has(key),
  );
  const source = hasSelection ? Object.fromEntries(params) : saved;
  const doctor = db.doctors.find((d) => d.id === source.doctorId && d.active);
  const pack = db.packages.find((p) => p.id === source.packageId && p.active);
  const branchId = source.branchId || doctor?.branchId || '';
  const branch = db.branches.find((b) => b.id === branchId && b.active);
  const specialtyId = source.specialtyId || doctor?.specialtyId || pack?.specialtyId || '';
  const specialty = db.specialties.find(
    (s) =>
      s.id === specialtyId &&
      s.active &&
      (!branch ||
        db.departments.some((d) => d.branchId === branch.id && d.specialtyId === s.id && d.active)),
  );
  const validDoctor =
    branch &&
    specialty &&
    doctor?.branchId === branch.id &&
    doctor?.specialtyId === specialty.id &&
    db.departments.some((d) => d.id === doctor.departmentId && d.active);
  const date =
    validDoctor && availableSlots(db, doctor.id, source.date).some((s) => s.available)
      ? source.date
      : '';
  return {
    branchId: branch?.id || '',
    specialtyId: specialty?.id || '',
    doctorId: validDoctor ? doctor.id : '',
    packageId:
      pack && specialty?.id === pack.specialtyId && (!branch || pack.branchIds.includes(branch.id))
        ? pack.id
        : '',
    date,
    time:
      date && availableSlots(db, doctor.id, date).some((s) => s.time === source.time && s.available)
        ? source.time
        : '',
    patientName: source.patientName || '',
    phone: source.phone || '',
    notes: source.notes || '',
  };
}
