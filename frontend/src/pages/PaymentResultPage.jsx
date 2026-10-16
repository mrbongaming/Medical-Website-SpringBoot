import { Link } from 'react-router-dom';

export function PaymentResultPage() {
  return (
    <div className="mx-auto min-h-[55vh] w-full max-w-3xl px-4 py-12 sm:px-6">
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-brand-900">Đang kiểm tra thanh toán</h1>
        <p className="my-4 text-amber-900">
          Trang này không tự xác nhận đã thu tiền từ tham số chuyển hướng. Khi bạn hoàn thiện VNPay,
          hãy tải trạng thái payment attempt từ backend sau khi IPN đã được xác minh.
        </p>
        <Link
          className="inline-flex min-h-11 items-center rounded-xl bg-sky-600 px-5 font-semibold text-white"
          to="/lich-hen"
        >
          Xem lịch hẹn
        </Link>
      </section>
    </div>
  );
}
