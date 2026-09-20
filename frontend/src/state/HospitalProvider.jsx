import { useEffect, useRef, useState } from 'react';
import { createSeed } from '../data/seed';
import { act } from '../data/domain';
import { DATA_KEY as KEY, readData } from '../data/storage';
import { HospitalContext } from './context';

const SESSION = 'antam-session-v1';
const read = () => readData(localStorage);
export default function HospitalProvider({ children }) {
  const [initial] = useState(() => {
    try {
      return { db: read(), error: '' };
    } catch {
      return {
        db: createSeed(),
        error:
          'Không đọc được dữ liệu đã lưu. Bạn đang xem dữ liệu mẫu tạm thời; hãy đăng nhập admin tổng để khôi phục.',
      };
    }
  });
  const [db, setDb] = useState(initial.db);
  const [storageError, setStorageError] = useState(initial.error);
  const [session, setSession] = useState(() => sessionStorage.getItem(SESSION) || '');
  const current = useRef(db);
  const user =
    db.users.find(
      (u) =>
        u.id === session &&
        u.active &&
        (!u.branchId || db.branches.some((b) => b.id === u.branchId && b.active)),
    ) || null;
  useEffect(() => {
    if (!initial.error) {
      try {
        localStorage.setItem(KEY, JSON.stringify(initial.db));
      } catch {
        /* Mutations will report unavailable storage. */
      }
    }
    function update(e) {
      if (e.key === KEY || e.key === null) {
        try {
          const next = read();
          current.current = next;
          setDb(next);
          setStorageError('');
        } catch {
          setStorageError(
            'Dữ liệu lưu trữ không hợp lệ. Hãy khôi phục dữ liệu mẫu bằng admin tổng.',
          );
        }
      }
    }
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, [initial]);
  function persist(next) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      throw new Error(
        'Không thể lưu dữ liệu trên trình duyệt. Hãy kiểm tra dung lượng hoặc quyền lưu trữ.',
      );
    }
    current.current = next;
    setDb(next);
  }
  function dispatch(type, payload) {
    if (storageError) throw new Error(storageError);
    const latest = localStorage.getItem(KEY) ? read() : current.current;
    const { db: next, result } = act(latest, user?.id, type, payload);
    persist(next);
    return result;
  }
  function login(id) {
    const u = current.current.users.find((u) => u.id === id && u.active);
    if (
      !u ||
      (u.branchId && !current.current.branches.some((b) => b.id === u.branchId && b.active))
    )
      throw new Error('Tài khoản hoặc cơ sở đã ngừng hoạt động.');
    sessionStorage.setItem(SESSION, id);
    setSession(id);
  }
  function logout() {
    sessionStorage.removeItem(SESSION);
    setSession('');
  }
  function reset() {
    if (user?.role !== 'superAdmin') throw new Error('Chỉ admin tổng được khôi phục dữ liệu.');
    persist(createSeed());
    setStorageError('');
  }
  return (
    <HospitalContext.Provider value={{ db, user, dispatch, login, logout, reset, storageError }}>
      {children}
    </HospitalContext.Provider>
  );
}
