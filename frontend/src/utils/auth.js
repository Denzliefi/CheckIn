// src/utils/auth.js

export const TOKEN_KEY = "token";
export const ROLE_KEY = "role";
export const USER_KEY = "user";

/**
 * Helper: get the active storage
 * - localStorage → remember me
 * - sessionStorage → not remembered
 */
function getStorage(preferLocal = true) {
  return preferLocal ? localStorage : sessionStorage;
}

/**
 * Read helpers
 * Try localStorage first, then sessionStorage
 */
export function getToken() {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY)
  );
}

export function getRole() {
  return (
    localStorage.getItem(ROLE_KEY) ||
    sessionStorage.getItem(ROLE_KEY)
  );
}

export function getUser() {
  try {
    const raw =
      localStorage.getItem(USER_KEY) ||
      sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getToken();
}

/**
 * Save auth
 * @param {string} token
 * @param {object} user
 * @param {boolean} rememberMe
 */
export function setAuth(token, user, rememberMe = true) {
  // clear both first to avoid conflicts
  clearAuth();

  const storage = getStorage(rememberMe);

  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
  storage.setItem(ROLE_KEY, user?.role || "");
}

/**
 * Clear auth everywhere
 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);

  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(ROLE_KEY);
}

// keep logout as alias if used elsewhere
export function logout() {
  clearAuth();
}
