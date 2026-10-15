import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/client';
import { useHospital } from '../state/context';
import { roles } from '../data/mockData';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { roleWorkspacePath } from '../helpers/StaffHelpers';

export function AuthPage() {
  const { db, login, loginDemo, register, apiState } = useHospital();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('doctor');
  const [id, setId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function destination(account) {
    const target = params.get('next');
    return target?.startsWith('/') && !target.startsWith('//')
      ? target
      : roleWorkspacePath(account?.role);
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'demo') {
        loginDemo(id);
        navigate(destination(db.users.find((item) => item.id === id)));
        return;
      }
      const fields = Object.fromEntries(new FormData(event.currentTarget));
      const account =
        mode === 'register'
          ? await register({
              fullName: fields.fullName,
              email: fields.email,
              password: fields.password,
            })
          : await login({ email: fields.email, password: fields.password });
      navigate(destination(account));
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSubmitting(false);
    }
  }

  function selectMode(next) {
    setMode(next);
    setError('');
  }

  return (
    <div className="mx-auto my-8 grid min-h-[65vh] w-[calc(100%-2rem)] max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-2">
      <div className="bg-slate-900 p-6 text-white sm:p-10 [&_h1]:text-3xl [&_h1]:font-bold sm:[&_h1]:text-4xl [&_p]:mt-4 [&_p]:text-slate-300">
        <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.16em] text-sky-300">
          CHÀO MỪNG ĐẾN AN TÂM
        </span>
        <h1>
          Sức khỏe của bạn.
          <br />
          Sự tận tâm của chúng tôi.
        </h1>
        <p>Đăng nhập bằng tài khoản lưu trong MySQL qua backend Spring Boot.</p>
        <div className="mb-8 grid size-16 place-items-center rounded-2xl bg-white/15 text-4xl">
          ✚
        </div>
        <p>
          Trạng thái backend:{' '}
          <strong>{apiState === 'connected' ? 'đã kết nối' : 'chưa kết nối'}</strong>
        </p>
      </div>
      <section className="bg-white p-5 sm:p-8 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900">
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-px [&>button]:min-h-11 [&>button]:shrink-0 [&>button]:border-b-2 [&>button]:border-transparent [&>button]:px-4 [&>button]:font-semibold [&>button]:text-slate-500">
          {[
            ['login', 'Đăng nhập'],
            ['register', 'Đăng ký'],
            ['demo', 'Nhân sự demo'],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={mode === value ? 'border-sky-600! text-sky-700!' : ''}
              onClick={() => selectMode(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <h2>
          {mode === 'login'
            ? 'Đăng nhập bệnh nhân'
            : mode === 'register'
              ? 'Tạo tài khoản bệnh nhân'
              : 'Chọn tài khoản nhân sự mẫu'}
        </h2>
        <form className="space-y-4" onSubmit={submit}>
          {mode === 'demo' ? (
            <>
              <Select
                label="Vai trò"
                value={role}
                onChange={(value) => {
                  setRole(value);
                  setId('');
                }}
                options={Object.entries(roles).map(([value, name]) => ({ id: value, name }))}
                required
              />
              <Select
                label="Tài khoản demo"
                value={id}
                onChange={setId}
                options={db.users
                  .filter(
                    (item) =>
                      item.role === role &&
                      item.active &&
                      (!item.branchId ||
                        db.branches.some((branch) => branch.id === item.branchId && branch.active)),
                  )
                  .map((item) => ({
                    id: item.id,
                    name:
                      item.name +
                      (item.branchId
                        ? ' · ' + db.branches.find((branch) => branch.id === item.branchId)?.name
                        : ''),
                  }))}
                required
              />
            </>
          ) : (
            <>
              {mode === 'register' && (
                <Field label="Họ và tên" required>
                  <input name="fullName" autoComplete="name" required />
                </Field>
              )}
              <Field label="Email" required>
                <input name="email" type="email" autoComplete="email" required />
              </Field>
              <Field label="Mật khẩu" hint="Ít nhất 8 ký tự." required>
                <input
                  name="password"
                  type="password"
                  minLength="8"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required
                />
              </Field>
            </>
          )}
          <Alert error={error} />
          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting
              ? 'Đang xử lý…'
              : mode === 'register'
                ? 'Tạo tài khoản'
                : mode === 'demo'
                  ? 'Vào không gian demo'
                  : 'Đăng nhập'}
          </Button>
        </form>
        {mode !== 'demo' && (
          <div className="mt-5 grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <Button as="a" variant="secondary" href={authApi.oauthUrl('google')} className="w-full">
              Tiếp tục với Google
            </Button>
            <Button
              as="a"
              variant="secondary"
              href={authApi.oauthUrl('facebook')}
              className="w-full"
            >
              Tiếp tục với Facebook
            </Button>
          </div>
        )}
        <p className="mt-5 text-sm text-slate-500">
          Tài khoản bệnh nhân được xác thực và lưu trong MySQL. Khu vực nhân sự vẫn là dữ liệu demo
          vì backend chưa có API quản trị tương ứng.
        </p>
      </section>
    </div>
  );
}
