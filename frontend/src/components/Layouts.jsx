import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  FiActivity,
  FiArrowRight,
  FiCalendar,
  FiGrid,
  FiLayers,
  FiLogOut,
  FiMenu,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { useHospital } from '../state/context';
import { hospital, roles } from '../data/seed';

export function Brand() {
  return (
    <Link className="brand" to="/">
      <span className="brand-icon">✚</span>
      <span>
        AN TÂM<small>BỆNH VIỆN ĐA KHOA</small>
      </span>
    </Link>
  );
}
export function RequireRole({ roles: allowed }) {
  const { user } = useHospital();
  const location = useLocation();
  if (!user)
    return (
      <Navigate
        to={'/dang-nhap?next=' + encodeURIComponent(location.pathname + location.search)}
        replace
      />
    );
  if (!allowed.includes(user.role))
    return (
      <div className="container page">
        <h1>Bạn không có quyền truy cập</h1>
        <Link className="button" to="/">
          Về trang chủ
        </Link>
      </div>
    );
  return <Outlet />;
}
export function PublicLayout() {
  const { user, logout, storageError } = useHospital();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  return (
    <>
      <a href="#main-content" className="skip">
        Đến nội dung chính
      </a>
      <div className="topbar">
        <div className="container">
          <span>Một hệ thống chăm sóc · Bốn cơ sở kết nối</span>
          <span>Tư vấn / đặt khám: {hospital.phone}</span>
        </div>
      </div>
      <header className="public-header">
        <div className="container header-row">
          <Brand />
          <button
            className="mobile-toggle"
            aria-label="Mở menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
          <nav className={open ? 'public-nav open' : 'public-nav'} onClick={() => setOpen(false)}>
            {[
              ['/', 'Trang chủ'],
              ['/co-so', 'Hệ thống cơ sở'],
              ['/chuyen-khoa', 'Chuyên khoa'],
              ['/bac-si', 'Bác sĩ'],
              ['/goi-kham', 'Gói khám'],
            ].map(([to, name]) => (
              <NavLink key={to} end={to === '/'} to={to}>
                {name}
              </NavLink>
            ))}
            <Link className="button small" to="/dat-lich">
              Đặt lịch khám <FiArrowRight />
            </Link>
          </nav>
        </div>
        <div className="container account-strip">
          {user ? (
            <>
              <span>
                {user.name} · {roles[user.role]}
              </span>
              <Link
                to={
                  user.role === 'patient'
                    ? '/lich-hen'
                    : user.role === 'doctor'
                      ? '/bac-si-lam-viec'
                      : '/quan-tri'
                }
              >
                Không gian của tôi
              </Link>
              <Link to="/tai-khoan">Hồ sơ</Link>
              <button className="link-button" onClick={logout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <Link to="/dang-nhap">Đăng nhập demo / Đăng ký</Link>
          )}
        </div>
      </header>
      {storageError && <div className="container alert error">{storageError}</div>}
      {user?.role === 'patient' &&
        ['/lich-hen', '/ho-so-kham', '/tai-khoan'].some((path) =>
          location.pathname.startsWith(path),
        ) && (
          <div className="patient-navigation">
            <nav className="container">
              <NavLink to="/lich-hen">Lịch hẹn</NavLink>
              <NavLink to="/ho-so-kham">Lịch sử khám</NavLink>
              <NavLink to="/tai-khoan">Thông tin cá nhân</NavLink>
            </nav>
          </div>
        )}
      <main id="main-content">
        <Outlet />
      </main>
      <footer>
        <div className="container footer-grid">
          <div>
            <Brand />
            <p>{hospital.tagline}</p>
            <p>Chăm sóc sức khỏe gần bạn, đồng hành cùng gia đình.</p>
          </div>
          <div>
            <h3>Khám phá</h3>
            <Link to="/gioi-thieu">Về bệnh viện</Link>
            <Link to="/co-so">Hệ thống cơ sở</Link>
            <Link to="/huong-dan">Hướng dẫn đặt khám</Link>
          </div>
          <div>
            <h3>Kết nối với An Tâm</h3>
            <Link to="/lien-he">Thông tin liên hệ</Link>
            <span>{hospital.email}</span>
            <Link to="/dang-nhap">Không gian nhân sự</Link>
          </div>
        </div>
        <div className="container footer-note">
          © An Tâm · Bản demo dùng dữ liệu giả định, không tiếp nhận lịch khám thực tế.
        </div>
      </footer>
    </>
  );
}
export function StaffLayout() {
  const { user, db, logout, storageError } = useHospital();
  const [open, setOpen] = useState(false);
  const doctor = user.role === 'doctor';
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
        ['/co-so', 'Cơ sở', FiLayers],
        ['/khoa-phong', 'Khoa / phòng', FiLayers],
        ['/bac-si', 'Bác sĩ', FiUsers],
        ['/lich-lam-viec', 'Lịch làm việc', FiCalendar],
        ...(user.role === 'superAdmin'
          ? [
              ['/admin', 'Admin cơ sở', FiUsers],
              ['/chuyen-khoa', 'Chuyên khoa', FiLayers],
              ['/goi-kham', 'Gói khám', FiLayers],
              ['/he-thong', 'Dữ liệu demo', FiGrid],
            ]
          : []),
      ];
  return (
    <div className="workspace">
      <a href="#main-content" className="skip">
        Đến nội dung chính
      </a>
      <aside className={'sidebar ' + (open ? 'open' : '')}>
        <Brand />
        <div className="workspace-label">
          {roles[user.role]}
          <small>{db.branches.find((b) => b.id === user.branchId)?.name || 'Toàn hệ thống'}</small>
        </div>
        <nav>
          {links.map(([path, label, Icon]) => (
            <NavLink to={base + path} end key={path} onClick={() => setOpen(false)}>
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
        <Link className="back-site" to="/">
          ← Website bệnh viện
        </Link>
      </aside>
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="workspace-body">
        <header className="workspace-top">
          <button
            className="mobile-toggle"
            aria-label="Mở menu quản trị"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <FiMenu />
          </button>
          <span>Không gian {doctor ? 'bác sĩ' : 'quản trị'}</span>
          <div className="user-chip">
            <span className="avatar small">{user.name.slice(0, 1)}</span>
            <span>
              {user.name}
              <small>{roles[user.role]}</small>
            </span>
            <button
              className="icon-button"
              title="Đăng xuất"
              aria-label="Đăng xuất"
              onClick={logout}
            >
              <FiLogOut />
            </button>
          </div>
        </header>
        <main className="workspace-main" id="main-content">
          {storageError && <p className="alert error">{storageError}</p>}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
