import { promotionDiscount, selectPromotion } from './PromotionHelpers.js';

export function calculatePrice(items, insurance = { status: 'none' }, promotion = null) {
  const unresolved = ['pending', 'supplement'].includes(insurance.status);
  const lines = items.map((item) => {
    const total = item.unitPrice * item.quantity;
    const policyLine = insurance.policy?.services?.find((s) => s.serviceId === item.serviceId);
    const conditionMet = !item.insuranceCondition || insurance.medicineConditionsConfirmed;
    const tariff =
      insurance.status === 'verified' && conditionMet
        ? (item.insuranceTariff ?? policyLine?.tariff ?? 0)
        : 0;
    const paymentRate =
      insurance.status === 'verified' ? (item.insuranceRate ?? policyLine?.paymentRate ?? 100) : 0;
    const covered = Math.floor(
      (Math.min(item.unitPrice, tariff) * item.quantity * paymentRate) / 100,
    );
    const benefitRate = insurance.fullCoverage ? 100 : insurance.benefitRate || insurance.rate || 0;
    const insurer = Math.floor(
      (((covered * benefitRate) / 100) * (insurance.routeRate || 0)) / 100,
    );
    return {
      ...item,
      total,
      tariff,
      paymentRate,
      covered,
      insurer,
      copay: covered - insurer,
      outside: total - covered,
    };
  });
  const sum = (key) => lines.reduce((n, i) => n + i[key], 0);
  const subtotal = sum('total');
  const preliminaryCovered = sum('covered');
  if (
    insurance.status === 'verified' &&
    !insurance.fullCoverage &&
    insurance.correctRoute &&
    insurance.lowCostThreshold > 0 &&
    preliminaryCovered < insurance.lowCostThreshold
  ) {
    for (const line of lines) {
      line.insurer = line.covered;
      line.copay = 0;
    }
  }
  const discount = promotionDiscount(promotion, lines, subtotal);
  const eligibleTotal = lines.reduce(
    (sum, item) =>
      sum +
      (item.discountable
        ? promotion?.discountScope === 'patient'
          ? item.copay + item.outside
          : item.outside
        : 0),
    0,
  );
  let remainingDiscount = discount;
  let remainingEligible = eligibleTotal;
  const pricedLines = lines.map((item) => {
    const eligible = item.discountable
      ? promotion?.discountScope === 'patient'
        ? item.copay + item.outside
        : item.outside
      : 0;
    const lineDiscount =
      eligible === 0
        ? 0
        : eligible === remainingEligible
          ? Math.min(eligible, remainingDiscount)
          : Math.min(eligible, Math.floor((discount * eligible) / (eligibleTotal || 1)));
    remainingDiscount -= lineDiscount;
    remainingEligible -= eligible;
    return {
      ...item,
      discount: lineDiscount,
      patientDue: item.copay + item.outside - lineDiscount,
    };
  });
  return {
    items: pricedLines,
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
    unitPrice:
      pack?.price ??
      doctor?.price ??
      db.serviceCatalog.find((s) => s.id === 'consultation')?.price ??
      0,
    quantity: 1,
    discountable: true,
  };
}

export function bookingItems(db, form) {
  const pack = db.packages.find((p) => p.id === form.packageId);
  return pack?.components?.length ? structuredClone(pack.components) : [bookingItem(db, form)];
}

export function bookingQuote(db, form, patientId) {
  const items = bookingItems(db, form);
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
      [
        ...(appointment.billing?.items || [
          {
            serviceId: 'consultation',
            name: appointment.serviceName,
            unitPrice: appointment.price,
            quantity: 1,
            discountable: true,
          },
        ]),
        ...(appointment.billing?.medicineItems || []),
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
