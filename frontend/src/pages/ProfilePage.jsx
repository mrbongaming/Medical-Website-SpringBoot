import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHospital } from '../state/context';
import { roles, dateKey } from '../data/seed';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';
import { PageTitle } from '../components/PageTitle';

export function ProfilePage() {
  const { user, dispatch } = useHospital();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  async function submit(e) {
    e.preventDefault();
    try {
      await dispatch('profile', Object.fromEntries(new FormData(e.currentTarget)));
      setSuccess('Đã cập nhật hồ sơ.');
      setError('');
    } catch (e) {
      setError(e.message);
      setSuccess('');
    }
  }
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[55vh] py-10 sm:py-14 max-w-4xl">
      <PageTitle title="Hồ sơ cá nhân" description={roles[user.role]} />
      <form
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900"
        onSubmit={submit}
        key={user.id}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Họ tên">
            <input name="name" defaultValue={user.name} required />
          </Field>
          <Field label="Số điện thoại">
            <input type="tel" name="phone" defaultValue={user.phone} pattern="0[0-9]{9}" required />
          </Field>
          <Field label="Ngày sinh">
            <input type="date" name="birthDate" defaultValue={user.birthDate} max={dateKey()} />
          </Field>
          <Field label="Địa chỉ">
            <input name="address" defaultValue={user.address} />
          </Field>
        </div>
        <Alert error={error} success={success} />
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50">
          Lưu thay đổi
        </button>
        {user.role === 'patient' && (
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/lich-hen">Lịch hẹn của tôi →</Link>
            <Link to="/ho-so-kham">Hồ sơ khám →</Link>
          </div>
        )}
      </form>
    </div>
  );
}
