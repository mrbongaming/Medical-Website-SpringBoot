import { addBillingData } from './billingSeed.js';
import { addInventoryData } from './inventorySeed.js';
import { createSeed } from './seed.js';
import { addV5Data } from './v5.js';

// Keep the existing key so open tabs and existing demo users migrate in place.
export const DATA_KEY = 'antam-data-v1';
export const collections = [
  'branches',
  'specialties',
  'departments',
  'doctors',
  'users',
  'packages',
  'schedules',
  'appointments',
  'records',
  'payments',
];

export function migrateData(value) {
  if (
    !value ||
    ![1, 2, 3, 4, 5].includes(value.version) ||
    collections.some(
      (key) =>
        !Array.isArray(value[key]) || value[key].some((row) => !row || typeof row.id !== 'string'),
    )
  )
    throw new Error('Dữ liệu demo không hợp lệ.');
  if ([3, 4, 5].includes(value.version)) {
    const extra = [
      'promotions',
      'serviceCatalog',
      'insurancePolicies',
      'promotionUses',
      'adjustments',
      'auditLogs',
      'insuranceSettlements',
    ];
    if (
      extra.some((key) => !Array.isArray(value[key])) ||
      value.appointments.some(
        (a) => !a.billing || !Array.isArray(a.billing.items) || !a.billing.insurance,
      )
    )
      throw new Error('Dữ liệu tài chính không hợp lệ.');
    if (value.version === 3) return addV5Data(addInventoryData(value));
    const inventoryKeys = [
      'medicines',
      'inventorySettings',
      'inventory',
      'stockRequests',
      'inventoryTransactions',
    ];
    if (inventoryKeys.some((key) => !Array.isArray(value[key])) || !value.stockSchedule)
      throw new Error('Dữ liệu kho thuốc không hợp lệ.');
    if (value.version === 4) return addV5Data(value);
    if (!Array.isArray(value.insuranceRules)) throw new Error('Dữ liệu BHYT không hợp lệ.');
    return value;
  }
  if (value.version === 2) return addV5Data(addInventoryData(addBillingData(value)));
  const next = {
    version: 2,
    seededAt: value.seededAt || '',
    ...Object.fromEntries(collections.map((key) => [key, structuredClone(value[key])])),
  };
  next.branches = next.branches.map((b) => ({ image: '/images/hospital.jpg', ...b }));
  next.doctors = next.doctors.map((d) => ({
    image: '/images/doctor-male.jpg',
    qualification: 'Bác sĩ',
    expertise: '',
    experience: 0,
    contactPhone: next.branches.find((b) => b.id === d.branchId)?.phone || '',
    ...d,
  }));
  return addV5Data(addInventoryData(addBillingData(next)));
}

export function readData(storage) {
  const raw = storage.getItem(DATA_KEY);
  return raw ? migrateData(JSON.parse(raw)) : createSeed();
}
