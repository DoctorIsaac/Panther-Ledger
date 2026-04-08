const BASE_URL = import.meta.env.VITE_API_URL

function authHeaders() {
  const raw = localStorage.getItem('session')
  const session = raw ? JSON.parse(raw) : null
  return session?.session_token ? { 'X-Session-Token': session.session_token } : {}
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw data
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) =>
    fetch(`${BASE_URL}${path}`, { method: 'POST', body: formData, headers: authHeaders() })
      .then(async res => { const data = await res.json(); if (!res.ok) throw data; return data }),
}

/* ── Auth helpers ── */
export function getSession() {
  const raw = localStorage.getItem('session')
  return raw ? JSON.parse(raw) : null
}

export function setSession(data) {
  localStorage.setItem('session', JSON.stringify(data))
}

export function clearSession() {
  localStorage.removeItem('session')
}
