import {
  FiActivity,
  FiAlertTriangle,
  FiBookOpen,
  FiCalendar,
  FiGrid,
  FiLayers,
  FiPackage,
  FiUsers,
} from 'react-icons/fi';

export function getStaffNavigation(role) {
  const doctor = role === 'doctor';
  const receptionist = role === 'staff';
  const base = doctor ? '/bac-si-lam-viec' : receptionist ? '/nhan-vien' : '/quan-tri';
  const links = doctor
    ? [
        ['', 'Lịch hẹn', FiCalendar],
        ['/lich-lam-viec', 'Lịch làm việc', FiGrid],
        ['/ho-so', 'Hồ sơ bệnh án', FiUsers],
        ['/tai-khoan', 'Hồ sơ cá nhân', FiActivity],
      ]
    : receptionist
      ? [
          ['', 'Duyệt & tiếp nhận', FiCalendar],
          ['/cap-thuoc', 'Cấp thuốc', FiPackage],
          ['/tai-khoan', 'Hồ sơ cá nhân', FiActivity],
        ]
      : [
          ['', 'Tổng quan & thống kê', FiGrid],
          ['/lich-hen', 'Lịch hẹn & khoản thu', FiCalendar],
          ['/khuyen-mai', 'Khuyến mãi', FiLayers],
          ['/bao-hiem', 'Bảo hiểm y tế', FiActivity],
          ['/kho-thuoc', 'Kho thuốc', FiPackage],
          ['/cap-thuoc', 'Cấp thuốc', FiPackage],
          ['/canh-bao', 'Cảnh báo', FiAlertTriangle],
          ['/nhat-ky', 'Nhật ký hoạt động', FiBookOpen],
          ['/noi-dung', 'Nội dung công khai', FiBookOpen],
          ['/nhan-vien', 'Nhân viên cơ sở', FiUsers],
          ['/co-so', 'Cơ sở', FiLayers],
          ['/khoa-phong', 'Khoa / phòng', FiLayers],
          ['/bac-si', 'Bác sĩ', FiUsers],
          ['/lich-lam-viec', 'Lịch làm việc', FiCalendar],
          ...(role === 'superAdmin'
            ? [
                ['/chuyen-khoa', 'Chuyên khoa', FiLayers],
                ['/goi-kham', 'Gói khám', FiLayers],
                ['/he-thong', 'Dữ liệu demo', FiGrid],
              ]
            : []),
        ];
  return { base, links };
}
