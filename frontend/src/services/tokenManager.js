// frontend/src/services/tokenManager.js
// Centralized token + user storage management (canonical + legacy keys)

// Canonical storage keys (preferred)
const REFRESH_TOKEN_KEY = 'tanisha_refresh_token';
const ACCESS_TOKEN_KEY = 'tanisha_access_token';
const USER_KEY = 'tanisha_user';

// Legacy keys still found in some older files
const LEGACY_ACCESS_KEYS = ['accessToken', 'token'];
const LEGACY_REFRESH_KEYS = ['refreshToken'];
const LEGACY_USER_KEYS = ['user'];

const readFirstExistingKey = (keys) => {
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return { key: k, value: v };
  }
  return { key: null, value: null };
};

export const TokenManager = {
  getAccessToken: () => {
    const direct = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (direct) return direct;

    const legacy = readFirstExistingKey(LEGACY_ACCESS_KEYS);
    if (legacy.value) {
      // migrate legacy -> canonical
      localStorage.setItem(ACCESS_TOKEN_KEY, legacy.value);
      return legacy.value;
    }
    return null;
  },

  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      // keep legacy keys in sync for older code paths (safe; remove later)
      localStorage.setItem('accessToken', token);
      localStorage.setItem('token', token);
    }
  },

  removeAccessToken: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    LEGACY_ACCESS_KEYS.forEach((k) => localStorage.removeItem(k));
  },

  getRefreshToken: () => {
    const direct = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (direct) return direct;

    const legacy = readFirstExistingKey(LEGACY_REFRESH_KEYS);
    if (legacy.value) {
      localStorage.setItem(REFRESH_TOKEN_KEY, legacy.value);
      return legacy.value;
    }
    return null;
  },

  setRefreshToken: (token) => {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
      // keep legacy key in sync
      localStorage.setItem('refreshToken', token);
    }
  },

  removeRefreshToken: () => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    LEGACY_REFRESH_KEYS.forEach((k) => localStorage.removeItem(k));
  },

  getUser: () => {
    const direct = localStorage.getItem(USER_KEY);
    if (direct) {
      try {
        return JSON.parse(direct);
      } catch {
        return null;
      }
    }

    const legacy = readFirstExistingKey(LEGACY_USER_KEYS);
    if (legacy.value) {
      localStorage.setItem(USER_KEY, legacy.value);
      try {
        return JSON.parse(legacy.value);
      } catch {
        return null;
      }
    }
    return null;
  },

  setUser: (user) => {
    if (user) {
      const val = JSON.stringify(user);
      localStorage.setItem(USER_KEY, val);
      localStorage.setItem('user', val); // legacy sync
    }
  },

  clearTokens: () => {
    TokenManager.removeAccessToken();
    TokenManager.removeRefreshToken();
    localStorage.removeItem(USER_KEY);
    LEGACY_USER_KEYS.forEach((k) => localStorage.removeItem(k));
  },
};
