export function promotionIssue(db, promotion, context, ignoreAppointmentId = '') {
  if (!promotion?.active) return 'Chương trình không tồn tại hoặc đã ngừng áp dụng.';
  if (context.date < promotion.startsOn || context.date > promotion.endsOn)
    return 'Ngày khám nằm ngoài thời gian khuyến mãi.';
  if (promotion.branchIds.length && !promotion.branchIds.includes(context.branchId))
    return 'Khuyến mãi không áp dụng tại cơ sở này.';
  if (
    promotion.serviceIds.length &&
    !context.items.some((i) => promotion.serviceIds.includes(i.serviceId))
  )
    return 'Dịch vụ không thuộc chương trình.';
  if (
    promotion.audience === 'new' &&
    db.appointments.some(
      (a) =>
        a.patientId === context.patientId &&
        a.status === 'completed' &&
        a.id !== ignoreAppointmentId,
    )
  )
    return 'Ưu đãi chỉ dành cho khách chưa có lần khám hoàn tất.';
  if (context.subtotal < promotion.minimum) return 'Chưa đạt giá trị tối thiểu của chương trình.';
  const uses = (db.promotionUses || []).filter(
    (u) =>
      u.promotionId === promotion.id &&
      u.appointmentId !== ignoreAppointmentId &&
      u.status !== 'released',
  );
  if (uses.length >= promotion.totalLimit) return 'Chương trình đã hết lượt.';
  if (
    context.patientId &&
    uses.filter((u) => u.patientId === context.patientId).length >= promotion.perPatientLimit
  )
    return 'Bạn đã dùng hết lượt của chương trình.';
  return '';
}

export function promotionDiscount(promotion, items, subtotal) {
  if (!promotion || subtotal < promotion.minimum) return 0;
  const eligible = items
    .filter(
      (i) =>
        i.discountable &&
        (!promotion.serviceIds.length || promotion.serviceIds.includes(i.serviceId)),
    )
    .reduce((sum, i) => sum + i.outside, 0);
  return Math.max(
    0,
    Math.min(
      eligible,
      promotion.maxDiscount,
      promotion.kind === 'percent'
        ? Math.floor((eligible * promotion.value) / 100)
        : promotion.value,
    ),
  );
}

export function selectPromotion(db, context, code = '') {
  const normalized = code.trim().toUpperCase();
  const entered = normalized
    ? db.promotions.find((p) => p.mode === 'code' && p.code === normalized)
    : null;
  if (normalized) {
    const issue = promotionIssue(db, entered, context);
    if (issue) return { promotion: null, error: issue };
  }
  const candidates = db.promotions.filter(
    (p) => (p.mode === 'auto' || p.id === entered?.id) && !promotionIssue(db, p, context),
  );
  candidates.sort(
    (a, b) =>
      promotionDiscount(b, context.items, context.subtotal) -
        promotionDiscount(a, context.items, context.subtotal) || a.id.localeCompare(b.id),
  );
  const promotion =
    candidates.find((p) => promotionDiscount(p, context.items, context.subtotal) > 0) || null;
  return {
    promotion,
    error: '',
    message:
      entered && promotion?.id !== entered.id
        ? 'Ưu đãi tự động có lợi hơn hoặc mã không giảm được khoản đủ điều kiện.'
        : '',
  };
}
