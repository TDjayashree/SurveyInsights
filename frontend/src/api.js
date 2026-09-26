export function getAdminToken() {
  return localStorage.getItem('survey_admin_token') || '';
}

export function setAdminToken(token) {
  if (token) {
    localStorage.setItem('survey_admin_token', token);
  } else {
    localStorage.removeItem('survey_admin_token');
  }
  window.dispatchEvent(new Event('auth_changed'));
}

export function isAuthenticated() {
  return Boolean(getAdminToken());
}

export async function adminFetch(url, options = {}) {
  const token = getAdminToken();
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    setAdminToken('');
    throw new Error('Session expired or unauthorized. Please log in as admin.');
  }
  return res;
}
