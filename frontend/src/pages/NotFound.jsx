import { Link } from 'react-router-dom';
import { Empty } from '../components/Empty';
import { PageTitle } from '../components/PageTitle';

export function NotFound() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[55vh] py-10 sm:py-14">
      <PageTitle title="Không tìm thấy trang" />
      <Empty text="Trang không tồn tại hoặc bạn không được phép xem nội dung này." />
      <Link
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50"
        to="/"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
