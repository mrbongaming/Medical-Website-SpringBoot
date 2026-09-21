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
