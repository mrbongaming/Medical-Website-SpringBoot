export const formatDate = (date) => new Date(date + 'T12:00:00').toLocaleDateString('vi-VN');

export const name = (db, collection, id) =>
  db[collection].find((r) => r.id === id)?.name || 'Đang cập nhật';

export const recordBase = (user) =>
  user.role === 'patient' ? '/ho-so-kham' : '/bac-si-lam-viec/ho-so';
