import { Link } from 'react-router-dom';

export function BookingPage() {
  return (
    <div className="mx-auto min-h-[55vh] w-full max-w-3xl px-4 py-12 sm:px-6">
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <h1 className="text-2xl font-bold">Chưa thể đặt lịch trực tuyến</h1>
        <p className="mt-3">
          Backend hiện chưa có API tạo lịch hẹn. Hệ thống sẽ không tạo lịch hẹn mẫu trên trình
          duyệt.
        </p>
        <Link
          className="mt-6 inline-flex rounded-lg bg-sky-700 px-5 py-2.5 font-semibold text-white"
          to="/co-so"
        >
          Xem cơ sở
        </Link>
      </section>
    </div>
  );
}
