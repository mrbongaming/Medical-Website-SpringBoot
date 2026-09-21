import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { FiArrowRight, FiMenu, FiX } from 'react-icons/fi';
import { useHospital } from '../state/context';
import { hospital, roles } from '../data/seed';
import { Brand } from './Brand';

export function PublicLayout() {
  const { user, logout, storageError } = useHospital();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-brand-900 px-4 py-2 font-semibold text-white transition focus:translate-y-0"
      >
        Đến nội dung chính
      </a>
      <div className="hidden bg-brand-900 py-2 text-xs text-sky-50 sm:block">
        <div className="mx-auto flex w-full max-w-7xl justify-between px-4 sm:px-6 lg:px-8">
          <span>Một hệ thống chăm sóc · Bốn cơ sở kết nối</span>
          <span>Tư vấn / đặt khám: {hospital.phone}</span>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex min-h-18 items-center justify-between gap-5">
          <Brand />
          <button
            className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-700 hover:bg-slate-50 lg:hidden"
            aria-label="Mở menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
          <nav
            className={`${open ? 'flex' : 'hidden'} absolute left-4 right-4 top-[4.75rem] flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl lg:static lg:flex lg:flex-row lg:items-center lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
            onClick={() => setOpen(false)}
          >
            {[
              ['/', 'Trang chủ'],
              ['/co-so', 'Hệ thống cơ sở'],
              ['/chuyen-khoa', 'Chuyên khoa'],
              ['/bac-si', 'Bác sĩ'],
              ['/goi-kham', 'Gói khám'],
            ].map(([to, name]) => (
              <NavLink
                key={to}
                end={to === '/'}
                to={to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'}`
                }
              >
                {name}
              </NavLink>
            ))}
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 min-h-9 px-4 py-2 text-sm"
              to="/dat-lich"
            >
              Đặt lịch khám <FiArrowRight />
            </Link>
          </nav>
        </div>
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex min-h-10 flex-wrap items-center justify-end gap-x-5 gap-y-1 border-t border-slate-100 py-2 text-sm text-slate-600 [&_a]:font-semibold [&_a]:text-sky-700">
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
              <button
                className="border-0 bg-transparent p-0 font-semibold text-sky-700 hover:text-sky-900"
                onClick={logout}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link to="/dang-nhap">Đăng nhập demo / Đăng ký</Link>
          )}
        </div>
      </header>
      {storageError && (
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 my-4 rounded-xl border p-4 text-sm font-medium border-red-200 bg-red-50 text-red-800">
          {storageError}
        </div>
      )}
      {user?.role === 'patient' &&
        ['/lich-hen', '/ho-so-kham', '/tai-khoan'].some((path) =>
          location.pathname.startsWith(path),
        ) && (
          <div className="border-b border-slate-200 bg-white">
            <nav className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
              {[
                ['/lich-hen', 'Lịch hẹn'],
                ['/ho-so-kham', 'Lịch sử khám'],
                ['/tai-khoan', 'Thông tin cá nhân'],
              ].map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${isActive ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500'}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-10 py-12 md:grid-cols-3 [&_h3]:mb-4 [&_h3]:font-bold [&_a]:mb-2 [&_a]:block [&_a]:text-slate-600 [&_p]:mt-4 [&_p]:text-slate-600">
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
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 border-t border-slate-200 py-5 text-sm text-slate-500">
          © An Tâm · Bản demo dùng dữ liệu giả định, không tiếp nhận lịch khám thực tế.
        </div>
      </footer>
    </>
  );
}
