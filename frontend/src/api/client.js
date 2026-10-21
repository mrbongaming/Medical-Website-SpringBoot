const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '');

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      'Không kết nối được backend. Hãy kiểm tra API Gateway đang chạy tại ' + API_BASE_URL + '.',
    );
  }

  if (!response.ok) {
    let message = '';
    try {
      const body = await response.json();
      message = body.message || body.detail || body.error || '';
    } catch {
      // The gateway can return an empty error response when a service is unavailable.
    }
    const error = new Error(message || `Yêu cầu thất bại (HTTP ${response.status}).`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export const authApi = {
  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (fullName, email, password) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    }),
  me: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  oauthUrl: (provider) => `${API_BASE_URL}/oauth2/authorization/${provider}`,
};

export const publicApi = {
  loadCatalogs: async () => {
    const [branches, specialties, doctors, packages, schedules] = await Promise.all([
      request('/api/public/branches'),
      request('/api/public/specialties'),
      request('/api/public/doctors'),
      request('/api/public/packages'),
      request('/api/public/schedules'),
    ]);
    return { branches, specialties, doctors, packages, schedules };
  },
};

export const appointmentApi = {
  currentUser: () => request('/api/appointments'),
  create: (payload) =>
    request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const profileApi = {
  get: () => request('/api/profile'),
  update: (profile) =>
    request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),
};

export const paymentApi = {
  createVnpay: (appointmentId) =>
    request('/api/payments/vnpay/create', {
      method: 'POST',
      body: JSON.stringify({ appointmentId }),
    }),
};
