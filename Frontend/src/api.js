export const API_ROOT_URL = import.meta.env.VITE_API_BASE_URL
const API_BASE_URL = `${API_ROOT_URL}/api`

export function getToken() {
  return localStorage.getItem('storeflow_token')
}

export function setToken(token) {
  localStorage.setItem('storeflow_token', token)
}

export function clearToken() {
  localStorage.removeItem('storeflow_token')
}

export function getTenantId() {
  return localStorage.getItem('storeflow_tenant_id')
}

export function setTenantId(tenantId) {
  if (tenantId === null || tenantId === undefined) {
    localStorage.removeItem('storeflow_tenant_id')
  } else {
    localStorage.setItem('storeflow_tenant_id', tenantId)
  }
}

export async function apiFetch(path, options = {}) {
  const token = getToken()
  const isFormData = options.body instanceof FormData

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      // FormData needs the browser to set its own multipart boundary —
      // forcing application/json here would corrupt the upload.
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw { status: response.status, data }
  }

  return data
}
