import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appointmentApi, authApi, publicApi } from '../api/client';
import { createSeed } from '../data/mockData';
import { act } from '../data/domain';
import { DATA_KEY as KEY, readData } from '../data/storage';
import { HospitalContext } from './context';

const DEMO_SESSION = 'antam-session-v1';
const read = () => readData(localStorage);

function frontendUser(user) {
  return {
    id: user.id,
    name: user.fullName || user.email,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    provider: user.provider || 'local',
    role: String(user.role || 'PATIENT').toLowerCase(),
    phone: '',
    birthDate: '',
    address: '',
    active: true,
    source: 'backend',
  };
}

function catalogData(db, catalogs) {
  const branches = catalogs.branches.map((item) => ({
    ...item,
    image: item.image || '/images/hospital.jpg',
    active: true,
  }));
  const specialties = catalogs.specialties.map((item) => ({ ...item, active: true }));
  const doctors = catalogs.doctors.map((item) => ({
    ...item,
    contactPhone: branches.find((branch) => branch.id === item.branchId)?.phone || '',
    expertise: item.bio || '',
    image: item.image || '/images/doctor-male.jpg',
    active: true,
  }));
  const packages = catalogs.packages.map((item) => ({
    ...item,
    branchIds: [
      ...new Set(
        doctors
          .filter((doctor) => doctor.specialtyId === item.specialtyId)
          .map((doctor) => doctor.branchId),
      ),
    ],
    active: true,
  }));
  return { ...db, branches, specialties, doctors, packages };
}

function backendAppointment(item, user, db) {
  const doctor = db.doctors.find((row) => row.id === item.doctorId);
  const price = Number(item.quotedPrice || 0);
  return {
    id: item.id,
    patientId: user.id,
    patientName: user.name,
    phone: user.phone || '',
    branchId: item.branchId,
    doctorId: item.doctorId || '',
    departmentId: doctor?.departmentId || '',
    specialtyId: item.specialtyId,
    packageId: '',
    bookingMode: String(item.bookingMode || 'doctor').toLowerCase(),
    date: item.date,
    time: item.time ? String(item.time).slice(0, 5) : '',
    status: String(item.status || 'pending').toLowerCase(),
    serviceName: item.serviceName,
    price,
    duration: 30,
    reason: '',
    createdAt: item.date,
    source: 'backend',
    billing: {
      items: [
        {
          serviceId: 'consultation',
          name: item.serviceName,
          unitPrice: price,
          quantity: 1,
          discountable: true,
        },
      ],
      insurance: { status: 'none' },
      promotion: null,
      finalized: null,
      settledAt: '',
      settlementId: '',
      legacy: false,
    },
  };
}

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
  const [demoSession, setDemoSession] = useState(() => sessionStorage.getItem(DEMO_SESSION) || '');
  const [backendUser, setBackendUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [apiState, setApiState] = useState('connecting');
  const [apiError, setApiError] = useState('');
  const current = useRef(db);

  const demoUser =
    db.users.find(
      (item) =>
        item.id === demoSession &&
        item.active &&
        (!item.branchId ||
          db.branches.some((branch) => branch.id === item.branchId && branch.active)),
    ) || null;
  const user = backendUser || demoUser;
  const visibleDb = useMemo(() => {
    if (!backendUser) return db;
    return {
      ...db,
      users: [...db.users.filter((item) => item.id !== backendUser.id), backendUser],
    };
  }, [db, backendUser]);

  const updateDb = useCallback((updater) => {
    setDb((previous) => {
      const next = typeof updater === 'function' ? updater(previous) : updater;
      current.current = next;
      return next;
    });
  }, []);

  const refreshApi = useCallback(async () => {
    setApiState('connecting');
    try {
      const catalogs = await publicApi.loadCatalogs();
      updateDb((previous) => catalogData(previous, catalogs));
      setApiState('connected');
      setApiError('');
      return true;
    } catch (error) {
      setApiState('unavailable');
      setApiError(error.message);
      return false;
    }
  }, [updateDb]);

  const loadBackendAppointments = useCallback(
    async (account) => {
      const rows = await appointmentApi.currentUser();
      updateDb((previous) => ({
        ...previous,
        appointments: [
          ...previous.appointments.filter((item) => item.source !== 'backend'),
          ...rows.map((item) => backendAppointment(item, account, previous)),
        ],
      }));
    },
    [updateDb],
  );

  const activateBackendAccount = useCallback(
    async (userView) => {
      const account = frontendUser(userView);
      sessionStorage.removeItem(DEMO_SESSION);
      setDemoSession('');
      setBackendUser(account);
      try {
        await loadBackendAppointments(account);
      } catch (error) {
        setApiError(error.message);
      }
      return account;
    },
    [loadBackendAppointments],
  );

  useEffect(() => {
    let cancelled = false;
    if (!initial.error) {
      try {
        localStorage.setItem(KEY, JSON.stringify(initial.db));
      } catch {
        /* Mutations will report unavailable storage. */
      }
    }

    publicApi
      .loadCatalogs()
      .then((catalogs) => {
        if (cancelled) return;
        updateDb((previous) => catalogData(previous, catalogs));
        setApiState('connected');
        setApiError('');
      })
      .catch((error) => {
        if (cancelled) return;
        setApiState('unavailable');
        setApiError(error.message);
      });

    authApi
      .me()
      .then((account) => {
        if (!cancelled) return activateBackendAccount(account);
        return null;
      })
      .catch((error) => {
        if (!cancelled && error.status !== 401) setApiError(error.message);
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });

    function update(event) {
      if (event.key === KEY || event.key === null) {
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
    return () => {
      cancelled = true;
      window.removeEventListener('storage', update);
    };
  }, [activateBackendAccount, initial, updateDb]);

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

  async function dispatch(type, payload) {
    if (backendUser) {
      throw new Error(
        'Chức năng này chưa có API ghi dữ liệu tương ứng ở backend. Dữ liệu sẽ không được lưu giả vào trình duyệt.',
      );
    }
    const mutate = async () => {
      if (storageError) throw new Error(storageError);
      const latest = localStorage.getItem(KEY) ? read() : current.current;
      const { db: next, result } = act(latest, user?.id, type, payload);
      persist(next);
      return result;
    };
    return navigator.locks?.request
      ? navigator.locks.request('antam-data-write', mutate)
      : mutate();
  }

  async function login({ email, password }) {
    const response = await authApi.login(email, password);
    setApiState('connected');
    setApiError('');
    return activateBackendAccount(response.user);
  }

  async function register({ fullName, email, password }) {
    const response = await authApi.register(fullName, email, password);
    setApiState('connected');
    setApiError('');
    return activateBackendAccount(response.user);
  }

  function loginDemo(id) {
    const account = current.current.users.find((item) => item.id === id && item.active);
    if (
      !account ||
      (account.branchId &&
        !current.current.branches.some((branch) => branch.id === account.branchId && branch.active))
    )
      throw new Error('Tài khoản hoặc cơ sở đã ngừng hoạt động.');
    setBackendUser(null);
    sessionStorage.setItem(DEMO_SESSION, id);
    setDemoSession(id);
  }

  async function logout() {
    sessionStorage.removeItem(DEMO_SESSION);
    setDemoSession('');
    if (backendUser) {
      try {
        await authApi.logout();
      } finally {
        setBackendUser(null);
        updateDb((previous) => ({
          ...previous,
          appointments: previous.appointments.filter((item) => item.source !== 'backend'),
        }));
      }
    }
  }

  async function reset() {
    if (user?.role !== 'superAdmin') throw new Error('Chỉ admin tổng được khôi phục dữ liệu.');
    const restore = async () => {
      persist(createSeed());
      setStorageError('');
    };
    return navigator.locks?.request
      ? navigator.locks.request('antam-data-write', restore)
      : restore();
  }

  return (
    <HospitalContext.Provider
      value={{
        db: visibleDb,
        user,
        dispatch,
        login,
        loginDemo,
        register,
        logout,
        reset,
        storageError,
        authReady,
        apiState,
        apiError,
        refreshApi,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
}
