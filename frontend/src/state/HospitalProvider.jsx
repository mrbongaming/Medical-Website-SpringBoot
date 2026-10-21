import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appointmentApi, authApi, profileApi, publicApi, setAccessToken } from '../api/client';
import { emptyData } from '../data/emptyData';
import { ToastStack } from '../components/ToastStack';
import { HospitalContext } from './context';

function frontendUser(user) {
  return {
    id: user.id,
    name: user.fullName || user.email,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    provider: user.provider || 'local',
    role: {
      PATIENT: 'patient',
      DOCTOR: 'doctor',
      STAFF: 'staff',
      BRANCH_ADMIN: 'branchAdmin',
      SUPER_ADMIN: 'superAdmin',
    }[String(user.role || 'PATIENT').toUpperCase()] || 'patient',
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
    branchIds: item.branchIds || [],
    active: true,
  }));
  const schedulePreviews = (catalogs.schedules || []).map((item) => ({
    ...item,
    times: item.times.map((time) => String(time).slice(0, 5)),
  }));
  return { ...db, branches, specialties, doctors, packages, schedulePreviews };
}

function catalogState(catalogs) {
  return ['branches', 'specialties', 'doctors', 'packages'].every(
    (key) => catalogs[key].length === 0,
  )
    ? 'empty'
    : 'connected';
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
    packageId: item.packageId || '',
    bookingMode: String(item.bookingMode || 'doctor').toLowerCase(),
    date: item.date,
    time: item.time ? String(item.time).slice(0, 5) : '',
    status: String(item.status || 'pending').toLowerCase(),
    serviceName: item.serviceName,
    price,
    paymentStatus: String(item.paymentStatus || 'legacy_unpaid'),
    prepaymentAmount: Number(item.prepaymentAmount || 0),
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
  const [db, setDb] = useState(emptyData);
  const [backendUser, setBackendUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [apiState, setApiState] = useState('connecting');
  const [apiError, setApiError] = useState('');
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const lastToast = useRef({ type: '', message: '', at: 0 });
  const toastTimers = useRef(new Map());

  const dismissToast = useCallback((id) => {
    clearTimeout(toastTimers.current.get(id));
    toastTimers.current.delete(id);
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (type, message) => {
      if (!message) return;
      const now = Date.now();
      if (
        lastToast.current.type === type &&
        lastToast.current.message === message &&
        now - lastToast.current.at < 500
      )
        return;
      lastToast.current = { type, message, at: now };
      const id = ++toastId.current;
      setToasts((previous) => [...previous.slice(-3), { id, type, message }]);
      toastTimers.current.set(
        id,
        setTimeout(() => dismissToast(id), type === 'error' ? 7000 : 5000),
      );
    },
    [dismissToast],
  );

  useEffect(() => {
    const timers = toastTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const user = backendUser;
  const visibleDb = useMemo(() => {
    if (!backendUser) return db;
    return { ...db, users: [backendUser] };
  }, [db, backendUser]);

  const updateDb = useCallback((updater) => {
    setDb((previous) => {
      return typeof updater === 'function' ? updater(previous) : updater;
    });
  }, []);

  const refreshApi = useCallback(async () => {
    setApiState('connecting');
    try {
      const catalogs = await publicApi.loadCatalogs();
      updateDb((previous) => catalogData(previous, catalogs));
      const state = catalogState(catalogs);
      setApiState(state);
      setApiError('');
      notify(
        state === 'empty' ? 'error' : 'success',
        state === 'empty'
          ? 'Kết nối thành công nhưng chưa có dữ liệu trong database.'
          : 'Đã kết nối và tải dữ liệu từ backend thành công.',
      );
      return state === 'connected';
    } catch (error) {
      setApiState('unavailable');
      setApiError(error.message);
      notify('error', 'Không kết nối được với backend hoặc database. Chưa có dữ liệu để hiển thị.');
      return false;
    }
  }, [notify, updateDb]);

  const loadBackendAppointments = useCallback(
    async (account) => {
      const rows = await appointmentApi.currentUser();
      updateDb((previous) => ({
        ...previous,
        appointments: rows.map((item) => backendAppointment(item, account, previous)),
      }));
    },
    [updateDb],
  );

  const activateBackendAccount = useCallback(
    async (userView) => {
      let account = frontendUser(userView);
      try {
        const profile = await profileApi.get();
        account = { ...account, ...profile, email: userView.email };
      } catch (error) {
        setApiError(error.message);
        throw error;
      }
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

    publicApi
      .loadCatalogs()
      .then((catalogs) => {
        if (cancelled) return;
        updateDb((previous) => catalogData(previous, catalogs));
        const state = catalogState(catalogs);
        setApiState(state);
        setApiError('');
        if (state === 'empty') notify('error', 'Chưa có dữ liệu trong database.');
      })
      .catch((error) => {
        if (cancelled) return;
        setApiState('unavailable');
        setApiError(error.message);
        notify(
          'error',
          'Không kết nối được với backend hoặc database. Chưa có dữ liệu để hiển thị.',
        );
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

    return () => {
      cancelled = true;
    };
  }, [activateBackendAccount, notify, updateDb]);

  async function dispatch(type, payload) {
    if (type === 'profile') {
      const profile = await profileApi.update(payload);
      setBackendUser((current) => ({ ...current, ...profile }));
      return profile;
    }
    void type;
    void payload;
    throw new Error('Chức năng này chưa có API ghi dữ liệu ở backend.');
  }

  async function bookAppointment(payload) {
    let result;
    try {
      result = await appointmentApi.create(payload);
    } catch (error) {
      if (error.status === 401) setBackendUser(null);
      throw error;
    }
    try {
      const profile = await profileApi.get();
      const account = { ...backendUser, ...profile };
      setBackendUser(account);
      await loadBackendAppointments(account);
    } catch (error) {
      setApiError(error.message);
    }
    return result.id;
  }

  async function login({ email, password }) {
    const response = await authApi.login(email, password);
    setAccessToken(response.accessToken);
    const account = await activateBackendAccount(response.user);
    setApiError('');
    notify('success', 'Đăng nhập thành công.');
    return account;
  }

  async function register({ fullName, email, password }) {
    const response = await authApi.register(fullName, email, password);
    setAccessToken(response.accessToken);
    const account = await activateBackendAccount(response.user);
    setApiError('');
    notify('success', 'Đăng ký thành công.');
    return account;
  }

  async function logout() {
    if (backendUser) {
      try {
        await authApi.logout();
      } catch (error) {
        notify('error', `Không đăng xuất được khỏi backend: ${error.message}`);
        return;
      } finally {
        setAccessToken(null);
        setBackendUser(null);
        updateDb((previous) => ({
          ...previous,
          appointments: [],
        }));
      }
    }
    notify('success', 'Đã đăng xuất.');
  }

  return (
    <HospitalContext.Provider
      value={{
        db: visibleDb,
        user,
        dispatch,
        login,
        register,
        bookAppointment,
        logout,
        authReady,
        apiState,
        apiError,
        refreshApi,
        notify,
      }}
    >
      {children}
      <ToastStack toasts={toasts} dismiss={dismissToast} />
    </HospitalContext.Provider>
  );
}
