const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '');

const TOKEN_KEY = 'antam_access_token';
let accessToken = null;
try {
  accessToken = sessionStorage.getItem(TOKEN_KEY);
} catch {
  // The browser may block storage; the token still works for this page load.
}

export function setAccessToken(token) {
  accessToken = token || null;
  try {
    if (accessToken) sessionStorage.setItem(TOKEN_KEY, accessToken);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Continue with the in-memory token when storage is unavailable.
  }
}

async function request(path, options = {}) {
  const { skipAuth = false, ...fetchOptions } = options;
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      ...fetchOptions,
      headers: {
        ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
        ...(!skipAuth && !path.startsWith('/api/public/') && accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {}),
        ...fetchOptions.headers,
      },
    });
  } catch {
    throw new Error(
      'Không kết nối được backend. Hãy kiểm tra API Gateway đang chạy tại ' + API_BASE_URL + '.',
    );
  }

  if (!response.ok) {
    if (response.status === 401 && accessToken) setAccessToken(null);
    let message = '';
    try {
      const body = await response.json();
      message = body.message || body.detail || body.error || '';
    } catch {
      // The gateway can return an empty error response when a service is unavailable.
    }
    if (response.status === 401 && (!message || message === 'Unauthorized')) {
      message = 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
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
      skipAuth: true,
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (fullName, email, password) =>
    request('/api/auth/register', {
      skipAuth: true,
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    }),
  me: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST', skipAuth: true }),
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
