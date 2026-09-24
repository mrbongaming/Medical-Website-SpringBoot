import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { FiLogOut, FiMenu } from 'react-icons/fi';
import { useHospital } from '../state/context';
import { roles } from '../data/seed';
import { Brand } from './Brand';
import { getStaffNavigation } from '../helpers/StaffHelpers';

export function StaffLayout() {
  const { user, db, logout, storageError } = useHospital();
  const [open, setOpen] = useState(false);
  const doctor = user.role === 'doctor';
  const receptionist = user.role === 'staff';
  const { base, links } = getStaffNavigation(user.role);
  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-brand-900 px-4 py-2 font-semibold text-white transition focus:translate-y-0"
      >
        Đến nội dung chính
      </a>
      <aside
        data-testid="staff-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand-900 py-5 shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Brand inverse />
        <div className="mx-4 rounded-xl bg-white/10 p-3 text-sm font-semibold text-white [&_small]:mt-1 [&_small]:block [&_small]:font-normal [&_small]:text-sky-200">
          {roles[user.role]}
          <small>{db.branches.find((b) => b.id === user.branchId)?.name || 'Toàn hệ thống'}</small>
        </div>
        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto px-3">
          {links.map(([path, label, Icon]) => (
            <NavLink
              to={base + path}
              end
              key={path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-white text-brand-900 shadow-sm' : 'text-sky-100 hover:bg-white/10 hover:text-white'}`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
        <Link
          className="mx-4 mt-auto block border-t border-white/10 py-5 text-sm font-semibold text-sky-100 hover:text-white"
          to="/"
        >
          ← Website bệnh viện
        </Link>
      </aside>
      {open && (
        <button
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
          <button
            className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-700 hover:bg-slate-50 lg:hidden"
            data-testid="staff-menu-toggle"
            aria-label="Mở menu quản trị"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <FiMenu />
          </button>
          <span>Không gian {doctor ? 'bác sĩ' : receptionist ? 'nhân viên' : 'quản trị'}</span>
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-800 [&_small]:block [&_small]:font-normal [&_small]:text-slate-500">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sky-100 text-sm font-bold text-sky-800">
              {user.name.slice(0, 1)}
            </span>
            <span>
              {user.name}
              <small>{roles[user.role]}</small>
            </span>
            <button
              className="inline-flex size-10 items-center justify-center rounded-full border-0 bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
              title="Đăng xuất"
              aria-label="Đăng xuất"
              onClick={logout}
            >
              <FiLogOut />
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8" id="main-content">
          {storageError && (
            <p className="my-4 rounded-xl border p-4 text-sm font-medium border-red-200 bg-red-50 text-red-800">
              {storageError}
            </p>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
