import { FiActivity, FiCalendar, FiGrid, FiLayers, FiUsers } from 'react-icons/fi';

export function getStaffNavigation(role) {
  const doctor = role === 'doctor';
  const base = doctor ? '/bac-si-lam-viec' : '/quan-tri';
  const links = doctor
    ? [
        ['', 'Lịch hẹn', FiCalendar],
        ['/lich-lam-viec', 'Lịch làm việc', FiGrid],
        ['/ho-so', 'Hồ sơ bệnh án', FiUsers],
        ['/tai-khoan', 'Hồ sơ cá nhân', FiActivity],
      ]
    : [
        ['', 'Tổng quan & thống kê', FiGrid],
        ['/lich-hen', 'Lịch hẹn & khoản thu', FiCalendar],
        ['/khuyen-mai', 'Khuyến mãi', FiLayers],
        ['/bao-hiem', 'Bảo hiểm y tế', FiActivity],
        ['/co-so', 'Cơ sở', FiLayers],
        ['/khoa-phong', 'Khoa / phòng', FiLayers],
        ['/bac-si', 'Bác sĩ', FiUsers],
        ['/lich-lam-viec', 'Lịch làm việc', FiCalendar],
        ...(role === 'superAdmin'
          ? [
              ['/admin', 'Admin cơ sở', FiUsers],
              ['/chuyen-khoa', 'Chuyên khoa', FiLayers],
              ['/goi-kham', 'Gói khám', FiLayers],
              ['/he-thong', 'Dữ liệu demo', FiGrid],
            ]
          : []),
      ];
  return { base, links };
}
