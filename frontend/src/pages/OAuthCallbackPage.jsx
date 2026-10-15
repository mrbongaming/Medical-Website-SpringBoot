import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHospital } from '../state/context';

export function OAuthCallbackPage() {
  const { user, authReady, apiError } = useHospital();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authReady) return;
    navigate(user ? '/lich-hen' : '/dang-nhap', { replace: true });
  }, [authReady, navigate, user]);

  return (
    <div className="mx-auto min-h-[55vh] w-full max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-brand-900">Đang hoàn tất đăng nhập…</h1>
      <p className="mt-3 text-slate-600">
        {apiError || 'Frontend đang kiểm tra phiên đăng nhập với backend.'}
      </p>
    </div>
  );
}
