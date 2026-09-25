export const insuranceStatuses = {
  none: 'Không sử dụng BHYT',
  pending: 'Chờ xác minh BHYT',
  supplement: 'Cần bổ sung BHYT',
  verified: 'Đã xác minh BHYT mô phỏng',
  rejected: 'Không đủ điều kiện BHYT',
};

export function insurancePolicy(db, branchId, date) {
  return (db.insurancePolicies || [])
    .filter((p) => p.branchId === branchId && p.effectiveFrom <= date && p.effectiveTo >= date)
    .sort((a, b) => b.version - a.version)[0];
}

export function insuranceRule(db, date) {
  return (db.insuranceRules || [])
    .filter((rule) => rule.effectiveFrom <= date && rule.effectiveTo >= date)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
}

export function deriveInsuranceCoverage(db, appointment, values) {
  const branch = db.branches.find((item) => item.id === appointment.branchId);
  const rule = insuranceRule(db, appointment.date);
  const benefitRate = Number(values.benefitRate || values.rate);
  if (![80, 95, 100].includes(benefitRate))
    throw new Error('Mức hưởng BHYT theo nhóm đối tượng không hợp lệ.');
  const treatmentType = values.treatmentType === 'inpatient' ? 'inpatient' : 'outpatient';
  const legacyRoute = values.routeRate === undefined ? null : Number(values.routeRate);
  const correctRoute =
    values.correctRoute === true ||
    values.correctRoute === 'true' ||
    values.correctRoute === 'on' ||
    values.emergency === true ||
    values.emergency === 'on' ||
    !!String(values.referral || '').trim() ||
    legacyRoute === 100;
  let routeRate = 100;
  if (legacyRoute !== null) routeRate = legacyRoute;
  else if (!correctRoute) {
    if (treatmentType === 'inpatient') routeRate = branch?.careLevel === 'specialized' ? 40 : 100;
    else if (appointment.date >= '2026-07-01') routeRate = 50;
    else routeRate = values.specialDisease === 'on' ? 100 : 0;
  }
  const fiveYearExempt = values.fiveYearExempt === true || values.fiveYearExempt === 'on';
  const annualCopayPaid = Math.max(0, Number(values.annualCopayPaid || 0));
  if (!Number.isFinite(annualCopayPaid))
    throw new Error('Số tiền đồng chi trả trong năm không hợp lệ.');
  return {
    benefitRate,
    rate: benefitRate,
    routeRate,
    treatmentType,
    correctRoute,
    emergency: values.emergency === true || values.emergency === 'on',
    specialDisease: values.specialDisease === true || values.specialDisease === 'on',
    fullCoverage:
      benefitRate === 100 ||
      (fiveYearExempt &&
        correctRoute &&
        annualCopayPaid >= (rule?.annualCopayThreshold || Infinity)),
    fiveYearExempt,
    annualCopayPaid,
    medicineConditionsConfirmed:
      values.medicineConditionsConfirmed === true || values.medicineConditionsConfirmed === 'on',
    lowCostThreshold: rule?.lowCostThreshold || 0,
    annualCopayThreshold: rule?.annualCopayThreshold || 0,
    rule: rule ? structuredClone(rule) : null,
  };
}

export const validInsuranceDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export function insuranceInput(values = {}) {
  if (!values.enabled) return { status: 'none' };
  const cardNumber = String(values.cardNumber || '')
    .trim()
    .toUpperCase();
  if (!/^[A-Z0-9]{10,15}$/.test(cardNumber))
    throw new Error('Nhập mã thẻ/định danh BHYT mẫu gồm 10–15 ký tự chữ hoặc số.');
  if (
    !validInsuranceDate(values.validFrom) ||
    !validInsuranceDate(values.validTo) ||
    values.validFrom > values.validTo
  )
    throw new Error('Thời hạn BHYT không hợp lệ.');
  if (!String(values.registeredFacility || '').trim())
    throw new Error('Nhập nơi đăng ký khám BHYT ban đầu.');
  return {
    status: 'pending',
    cardNumber,
    validFrom: values.validFrom,
    validTo: values.validTo,
    registeredFacility: String(values.registeredFacility).trim(),
    referral: String(values.referral || '').trim(),
  };
}
