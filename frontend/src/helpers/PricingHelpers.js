import { promotionDiscount, selectPromotion } from './PromotionHelpers.js';

export function calculatePrice(items, insurance = { status: 'none' }, promotion = null) {
  const unresolved = ['pending', 'supplement'].includes(insurance.status);
  const lines = items.map((item) => {
    const total = item.unitPrice * item.quantity;
    const tariff =
      insurance.status === 'verified'
        ? insurance.policy.services.find((s) => s.serviceId === item.serviceId)?.tariff || 0
        : 0;
    const covered = Math.min(item.unitPrice, tariff) * item.quantity;
    const insurer = Math.floor(
      (((covered * (insurance.rate || 0)) / 100) * (insurance.routeRate || 0)) / 100,
    );
    return { ...item, total, covered, insurer, copay: covered - insurer, outside: total - covered };
  });
  const sum = (key) => lines.reduce((n, i) => n + i[key], 0);
  const subtotal = sum('total');
  const discount = promotionDiscount(promotion, lines, subtotal);
  return {
    items: lines,
    subtotal,
    insurer: unresolved ? null : sum('insurer'),
    copay: unresolved ? null : sum('copay'),
    outside: unresolved ? null : sum('outside'),
    discount,
    patientDue: unresolved ? null : subtotal - sum('insurer') - discount,
    unresolved,
    promotionName: promotion?.name || '',
    promotionId: promotion?.id || '',
  };
}

export function bookingItem(db, form) {
  const pack = db.packages.find((p) => p.id === form.packageId);
  const doctor = db.doctors.find((d) => d.id === form.doctorId);
  return {
    serviceId: pack ? `package:${pack.id}` : 'consultation',
    name: pack?.name || 'Khám chuyên khoa',
    unitPrice: pack?.price ?? doctor?.price ?? 0,
    quantity: 1,
    discountable: true,
  };
}

export function bookingQuote(db, form, patientId) {
  const items = [bookingItem(db, form)];
  const insurance = { status: form.insurance?.enabled ? 'pending' : 'none' };
  const base = calculatePrice(items, insurance);
  const selected = selectPromotion(
    db,
    { ...form, patientId, items: base.items, subtotal: base.subtotal },
    form.promotionCode || '',
  );
  return { ...selected, price: calculatePrice(items, insurance, selected.promotion), items };
}

export function appointmentPrice(appointment) {
  return (
    appointment.billing?.finalized?.price ||
    calculatePrice(
      appointment.billing?.items || [
        {
          serviceId: 'consultation',
          name: appointment.serviceName,
          unitPrice: appointment.price,
          quantity: 1,
          discountable: true,
        },
      ],
      appointment.billing?.insurance,
      appointment.billing?.promotion,
    )
  );
}

export function financialBalance(db, appointment) {
  const price = appointmentPrice(appointment);
  const adjustments = (db.adjustments || []).filter((r) => r.appointmentId === appointment.id);
  const delta = adjustments.reduce(
    (sum, r) => sum + (r.kind === 'refund' ? -r.amount : r.amount),
    0,
  );
  const paid =
    db.payments
      .filter((p) => p.appointmentId === appointment.id)
      .reduce((n, p) => n + p.amount, 0) + delta;
  return {
    price,
    adjustments,
    delta,
    paid,
    patientDue: price.patientDue === null ? null : price.patientDue + delta,
    settled:
      !!appointment.billing?.settledAt ||
      db.payments.some((p) => p.appointmentId === appointment.id),
  };
}
