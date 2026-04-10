import axios from 'axios';
import { auth } from '../firebase';

// const api = axios.create({ baseURL: '/api' });



const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
});


/**
 * FIXED: Token cache per tab, not shared.
 * Original code had a module-level cache that could be stale when switching
 * between tabs, or could cause one tab to use another tab's token context.
 * 
 * Each tab now maintains its own token + expiry timestamp.
 * Token is refreshed 60s before expiry to prevent 401 errors mid-request.
 */
let _cachedToken = null;
let _tokenExpiry = 0;
let _refreshPromise = null; // prevent concurrent refresh calls

async function getFreshToken(user) {
  const now = Date.now();
  if (_cachedToken && now < _tokenExpiry - 60000) return _cachedToken;

  // Only one refresh at a time (prevents token request storms)
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = user.getIdToken(true).then(token => {
    _cachedToken = token;
    _tokenExpiry = now + 55 * 60 * 1000; // 55 min (Firebase tokens last 1h)
    _refreshPromise = null;
    return token;
  }).catch(err => {
    _refreshPromise = null;
    throw err;
  });

  return _refreshPromise;
}

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await getFreshToken(user);
      config.headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      console.error('Failed to get auth token:', err);
    }
  }
  return config;
});

// Invalidate cache on auth changes (logout, token refresh, etc.)
auth.onIdTokenChanged((user) => {
  _cachedToken = null;
  _tokenExpiry = 0;
  _refreshPromise = null;
});

// Handle 401 responses — token might have expired, force refresh once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;
      _cachedToken = null; // force refresh
      _tokenExpiry = 0;
      const user = auth.currentUser;
      if (user) {
        try {
          const token = await getFreshToken(user);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (_) {}
      }
    }
    return Promise.reject(error);
  }
);

// ── Accounts ─────────────────────────────────────────────────────────────────
export const accountsAPI = {
  getAll:     (profile)            => api.get(`/accounts/${profile}`),
  add:        (profile, account)   => api.post(`/accounts/${profile}`, account),
  bulkImport: (profile, accounts)  => api.post(`/accounts/${profile}/bulk`, { accounts }),

  generate: (profile, { username, startRange, endRange, password }) =>
    api.post(`/accounts/${profile}/generate`, { username, startRange, endRange, password }),

  update:     (profile, id, data)  => api.put(`/accounts/${profile}/${id}`, data),
  delete:     (profile, id)        => api.delete(`/accounts/${profile}/${id}`),
  bulkDelete: (profile, ids)       => api.delete(`/accounts/${profile}/bulk/delete`, { data: { ids } }),
  clearAll:   (profile)            => api.delete(`/accounts/${profile}/all/clear`),
};

// ── Processing ────────────────────────────────────────────────────────────────
export const processingAPI = {
  start:     (profile, opts) => api.post(`/processing/${profile}/start`, opts),
  stop:      (profile)       => api.post(`/processing/${profile}/stop`),
  status:    (profile)       => api.get(`/processing/${profile}/status`),
  setBet:    (profile, amt)  => api.put(`/processing/${profile}/bet`, { amount: amt }),
  allStatus: ()              => api.get('/processing/all/status'),
};

// ── Proxy ─────────────────────────────────────────────────────────────────────
export const proxyAPI = {
  get:  (profile)           => api.get(`/proxy/${profile}`),
  save: (profile, config)   => api.post(`/proxy/${profile}`, config),
  test: (profile, proxyUrl) => api.post(`/proxy/${profile}/test`, { proxyUrl }),
};

// ── Stats ─────────────────────────────────────────────────────────────────────
export const statsAPI = {
  get: (profile) => api.get(`/stats/${profile}`),
};

export default api;
