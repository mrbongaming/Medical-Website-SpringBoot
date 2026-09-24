import { useState } from 'react';
import { useHospital } from '../state/context';
import { Alert } from '../components/Alert';
import { Modal } from '../components/Modal';
import { PageTitle } from '../components/PageTitle';

export function SystemPage() {
  const { reset } = useHospital();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  return (
    <>
      <PageTitle title="Dữ liệu demo" />
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900">
        <h2>Khôi phục dữ liệu ban đầu</h2>
        <p>
          Tạo lại toàn bộ cơ sở, tài khoản, lịch hẹn, khoản thu mẫu. Các thay đổi cục bộ sẽ được
          thay thế, các tab đang mở được đồng bộ.
        </p>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 bg-red-600 text-white hover:bg-red-700"
          onClick={() => setConfirm(true)}
        >
          Khôi phục dữ liệu
        </button>
        <Alert success={success} />
      </div>
      {confirm && (
        <Modal title="Xác nhận khôi phục" close={() => setConfirm(false)}>
          <p>Tất cả thay đổi trên trình duyệt này sẽ mất. Bạn muốn trở về bộ dữ liệu mẫu?</p>
          <Alert error={error} />
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 bg-red-600 text-white hover:bg-red-700"
            onClick={async () => {
              try {
                await reset();
                setConfirm(false);
                setSuccess('Đã khôi phục dữ liệu mẫu.');
              } catch (e) {
                setError(e.message);
              }
            }}
          >
            Xác nhận khôi phục
          </button>
        </Modal>
      )}
    </>
  );
}
