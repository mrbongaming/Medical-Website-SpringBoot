import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useHospital } from '../state/context';

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
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[55vh] py-10 sm:py-14">
        <h1>Bạn không có quyền truy cập</h1>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50"
          to="/"
        >
          Về trang chủ
        </Link>
      </div>
    );
  return <Outlet />;
}
