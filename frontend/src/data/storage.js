import { createSeed } from './seed.js';

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
    ![1, 2].includes(value.version) ||
    collections.some(
      (key) =>
        !Array.isArray(value[key]) || value[key].some((row) => !row || typeof row.id !== 'string'),
    )
  )
    throw new Error('Dữ liệu demo không hợp lệ.');
  if (value.version === 2) return value;
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
  return next;
}

export function readData(storage) {
  const raw = storage.getItem(DATA_KEY);
  return raw ? migrateData(JSON.parse(raw)) : createSeed();
}
