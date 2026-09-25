import { availableSlots, future } from './domain.js';

export function initialBooking(db, params, saved = {}) {
  const selectionKeys = ['branchId', 'doctorId', 'specialtyId', 'packageId', 'date'];
  const hasSelection = selectionKeys.some((key) => params.has(key));
  const query = Object.fromEntries(params);
  const sameEntry =
    hasSelection &&
    selectionKeys.filter((key) => params.has(key)).every((key) => saved[key] === query[key]);
  const retained = sameEntry
    ? saved
    : {
        patientName: saved.patientName,
        phone: saved.phone,
        notes: saved.notes,
        promotionCode: saved.promotionCode,
        insurance: saved.insurance,
      };
  const source = hasSelection ? { ...retained, ...query } : saved;
  const doctor = db.doctors.find((d) => d.id === source.doctorId && d.active);
  const pack = db.packages.find((p) => p.id === source.packageId && p.active);
  const branchId =
    source.branchId || doctor?.branchId || (pack?.branchIds.length === 1 ? pack.branchIds[0] : '');
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
  const bookingMode = source.bookingMode === 'facility' ? 'facility' : 'doctor';
  const date =
    bookingMode === 'facility'
      ? future(source.date)
        ? source.date
        : ''
      : validDoctor && availableSlots(db, doctor.id, source.date).some((s) => s.available)
        ? source.date
        : '';
  return {
    branchId: branch?.id || '',
    specialtyId: specialty?.id || '',
    bookingMode: validDoctor ? 'doctor' : bookingMode,
    doctorId: validDoctor ? doctor.id : '',
    packageId:
      pack && specialty?.id === pack.specialtyId && (!branch || pack.branchIds.includes(branch.id))
        ? pack.id
        : '',
    date,
    time:
      validDoctor &&
      date &&
      availableSlots(db, doctor.id, date).some((s) => s.time === source.time && s.available)
        ? source.time
        : '',
    patientName: source.patientName || '',
    phone: source.phone || '',
    notes: source.notes || '',
    promotionCode: String(source.promotionCode || ''),
    insurance:
      source.insurance && typeof source.insurance === 'object'
        ? source.insurance
        : { enabled: false },
  };
}

export function bookingStartStep(form) {
  if (
    form.branchId &&
    form.specialtyId &&
    form.date &&
    (form.bookingMode === 'facility' || form.time)
  )
    return 3;
  if (form.branchId && form.specialtyId && (form.doctorId || form.bookingMode === 'facility'))
    return 2;
  return 1;
}
