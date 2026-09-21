import { appointmentPrice, financialBalance } from '../helpers/PricingHelpers.js';
import { isAdmin, inBranch } from './domain.js';

export function report(db, user, filters) {
  if (!isAdmin(user)) throw new Error('Không có quyền xem thống kê.');
  const { from, to, branchId = '', doctorId = '', departmentId = '', status = '' } = filters;
  const period = (date) => !!date && date.slice(0, 10) >= from && date.slice(0, 10) <= to;
  const branch = (r) => inBranch(user, r.branchId) && (!branchId || r.branchId === branchId);
  const clinical = (a) =>
    branch(a) &&
    (!doctorId || a.doctorId === doctorId) &&
    (!departmentId || a.departmentId === departmentId) &&
    (!status || a.status === status);
  const appointments = db.appointments.filter((a) => clinical(a) && period(a.date));
  const completed = appointments.filter((a) => a.status === 'completed');
  const payments = db.payments.filter(
    (p) =>
      branch(p) &&
      period(p.date) &&
      db.appointments.some((a) => a.id === p.appointmentId && clinical(a)),
  );
  const matchesTransaction = (p) =>
    branch(p) &&
    period(p.date) &&
    db.appointments.some((a) => a.id === p.appointmentId && clinical(a));
  const adjustments = db.adjustments.filter(matchesTransaction);
  const cashTransactions = [
    ...payments,
    ...adjustments.map((p) => ({ ...p, amount: p.kind === 'refund' ? -p.amount : p.amount })),
  ];
  const insuranceReceipts = db.insuranceSettlements.filter(matchesTransaction);
  const unpaid = completed.filter((a) => !financialBalance(db, a).settled);
  const unfinalized = unpaid.filter((a) => !a.billing.finalized);
  const insurancePending = completed.filter(
    (a) =>
      a.billing.finalized?.price.insurer > 0 &&
      !db.insuranceSettlements.some((s) => s.appointmentId === a.id),
  );
  const patients = [...new Set(appointments.map((a) => a.patientId))];
  const first = patients.filter(
    (id) =>
      completed.some((a) => a.patientId === id) &&
      !db.appointments.some(
        (a) => a.patientId === id && a.status === 'completed' && branch(a) && a.date < from,
      ),
  );
  const returning = patients.filter(
    (id) =>
      completed.some((a) => a.patientId === id) &&
      db.appointments.some(
        (a) => a.patientId === id && a.status === 'completed' && branch(a) && a.date < from,
      ),
  );
  const breakdown = Object.fromEntries(
    ['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'absent'].map((s) => [
      s,
      appointments.filter((a) => a.status === s).length,
    ]),
  );
  const staff = db.doctors
    .filter(
      (d) =>
        branch(d) &&
        (!doctorId || d.id === doctorId) &&
        (!departmentId || d.departmentId === departmentId),
    )
    .map((d) => {
      const rows = appointments.filter((a) => a.doctorId === d.id);
      const open = db.schedules
        .filter((s) => s.doctorId === d.id && period(s.date))
        .reduce((n, s) => n + s.times.length, 0);
      const used = rows.filter((a) =>
        ['pending', 'confirmed', 'completed', 'absent'].includes(a.status),
      ).length;
      return {
        id: d.id,
        name: d.name,
        branchId: d.branchId,
        departmentId: d.departmentId,
        appointments: rows.length,
        completed: rows.filter((a) => a.status === 'completed').length,
        rejected: rows.filter((a) => a.status === 'rejected').length,
        minutes: rows
          .filter((a) => !['rejected', 'cancelled'].includes(a.status))
          .reduce((s, a) => s + a.duration, 0),
        open,
        used,
        paid: cashTransactions
          .filter(
            (p) =>
              rows.some((a) => a.id === p.appointmentId) ||
              db.appointments.some((a) => a.id === p.appointmentId && a.doctorId === d.id),
          )
          .reduce((s, p) => s + p.amount, 0),
      };
    });
  const trend = Object.entries(
    appointments.reduce((groups, a) => {
      const key = filters.group === 'month' ? a.date.slice(0, 7) : a.date;
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
  const finance = ['branchId', 'doctorId', 'departmentId', 'packageId'].flatMap((field) => {
    const grouped = {};
    for (const p of cashTransactions) {
      const a = db.appointments.find((a) => a.id === p.appointmentId);
      const id = a[field] || 'Khám chuyên khoa';
      grouped[id] = (grouped[id] || 0) + p.amount;
    }
    return Object.entries(grouped).map(([id, amount]) => ({ field, id, amount }));
  });
  return {
    appointments,
    completed,
    payments,
    adjustments,
    insuranceReceipts,
    insurancePending,
    unfinalized,
    refunds: adjustments.filter((r) => r.kind === 'refund').reduce((sum, r) => sum + r.amount, 0),
    discounts: completed.reduce((sum, a) => sum + (a.billing.finalized?.price.discount || 0), 0),
    insuranceDebt: insurancePending.reduce((sum, a) => sum + a.billing.finalized.price.insurer, 0),
    insuranceReceived: insuranceReceipts.reduce((sum, r) => sum + r.amount, 0),
    unpaid,
    patients,
    first,
    returning,
    breakdown,
    staff,
    trend,
    finance,
    revenue: cashTransactions.reduce((s, p) => s + p.amount, 0),
    debt: unpaid
      .filter((a) => a.billing.finalized)
      .reduce((s, a) => s + appointmentPrice(a).patientDue, 0),
  };
}
