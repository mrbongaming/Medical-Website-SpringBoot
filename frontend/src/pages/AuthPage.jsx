import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useHospital } from '../state/context';
import { roles } from '../data/seed';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';
import { Select } from '../components/Select';

export function AuthPage() {
  const { db, login, dispatch } = useHospital();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [register, setRegister] = useState(false);
  const [role, setRole] = useState('patient');
  const [id, setId] = useState('');
  const [error, setError] = useState('');
  function enter(accountId) {
    login(accountId);
    const account = db.users.find((u) => u.id === accountId);
    const target = params.get('next');
    navigate(
      target?.startsWith('/') && !target.startsWith('//')
        ? target
        : account?.role === 'doctor'
          ? '/bac-si-lam-viec'
          : account?.role === 'staff'
            ? '/nhan-vien'
            : ['superAdmin', 'branchAdmin'].includes(account?.role)
              ? '/quan-tri'
              : '/lich-hen',
    );
  }
  async function submit(e) {
    e.preventDefault();
    try {
      setError('');
      if (register) {
        const f = Object.fromEntries(new FormData(e.currentTarget));
        const accountId = await dispatch('register', f);
        enter(accountId);
      } else enter(id);
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 min-h-[55vh] py-10 sm:py-14 grid min-h-[70vh] overflow-hidden rounded-3xl bg-white shadow-xl lg:grid-cols-2">
      <div className="bg-gradient-to-br from-brand-900 to-sky-700 p-8 text-white sm:p-12 [&_h1]:text-3xl [&_h1]:font-bold sm:[&_h1]:text-4xl [&_p]:mt-4 [&_p]:text-sky-100">
        <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
          CHÀO MỪNG ĐẾN AN TÂM
        </span>
        <h1>
          Sức khỏe của bạn.
          <br />
          Sự tận tâm của chúng tôi.
        </h1>
        <p>Một không gian kết nối bệnh nhân, bác sĩ và đội ngũ quản lý tại mọi cơ sở.</p>
        <div className="mb-8 grid size-16 place-items-center rounded-2xl bg-white/15 text-4xl">
          ✚
        </div>
        <p>
          Đây là phiên demo: chọn tài khoản để trải nghiệm vai trò, không nhập hay lưu mật khẩu.
        </p>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-brand-900">
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-px [&>button]:min-h-11 [&>button]:shrink-0 [&>button]:border-b-2 [&>button]:border-transparent [&>button]:px-4 [&>button]:font-semibold [&>button]:text-slate-500">
          <button
            className={!register ? 'border-sky-600! text-sky-700!' : ''}
            onClick={() => {
              setRegister(false);
              setError('');
            }}
          >
            Đăng nhập demo
          </button>
          <button
            className={register ? 'border-sky-600! text-sky-700!' : ''}
            onClick={() => {
              setRegister(true);
              setError('');
            }}
          >
            Tạo hồ sơ bệnh nhân
          </button>
        </div>
        <h2>{register ? 'Hồ sơ mới' : 'Chọn không gian của bạn'}</h2>
        <form onSubmit={submit}>
          {register ? (
            <>
              <Field label="Họ và tên">
                <input name="name" required />
              </Field>
              <Field label="Số điện thoại">
                <input
                  name="phone"
                  type="tel"
                  pattern="0[0-9]{9}"
                  title="10 số bắt đầu bằng 0"
                  required
                />
              </Field>
            </>
          ) : (
            <>
              <Select
                label="Vai trò"
                value={role}
                onChange={(v) => {
                  setRole(v);
                  setId('');
                }}
                options={Object.entries(roles).map(([id, name]) => ({ id, name }))}
                required
              />
              <Select
                label="Tài khoản demo"
                value={id}
                onChange={setId}
                options={db.users
                  .filter(
                    (u) =>
                      u.role === role &&
                      u.active &&
                      (!u.branchId || db.branches.some((b) => b.id === u.branchId && b.active)),
                  )
                  .map((u) => ({
                    id: u.id,
                    name:
                      u.name +
                      (u.branchId
                        ? ' · ' + db.branches.find((b) => b.id === u.branchId)?.name
                        : ''),
                  }))}
                required
              />
            </>
          )}
          <Alert error={error} />
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-50 w-full"
            type="submit"
          >
            {register ? 'Tạo hồ sơ và tiếp tục' : 'Vào không gian làm việc'} →
          </button>
        </form>
        <p className="text-slate-500 text-sm text-slate-500">
          Dữ liệu chỉ lưu tại trình duyệt này. Có thể đổi vai trò bằng cách đăng xuất và chọn tài
          khoản khác.
        </p>
      </section>
    </div>
  );
}
