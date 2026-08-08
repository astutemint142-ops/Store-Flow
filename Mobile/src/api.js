import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DEFAULT_API_BASE_URL } from './config'

const TOKEN_KEY = 'storeflow_token'
const TENANT_KEY = 'storeflow_tenant_id'
const API_BASE_URL_KEY = 'storeflow_api_base_url'
const SAVED_SERVERS_KEY = 'storeflow_saved_servers'

let cachedApiBaseUrl = null

export async function getApiBaseUrl() {
  if (cachedApiBaseUrl) return cachedApiBaseUrl

  const stored = await AsyncStorage.getItem(API_BASE_URL_KEY)
  cachedApiBaseUrl = stored || DEFAULT_API_BASE_URL
  return cachedApiBaseUrl
}

export async function setApiBaseUrl(url) {
  const trimmed = url.trim().replace(/\/+$/, '')
  cachedApiBaseUrl = trimmed
  return AsyncStorage.setItem(API_BASE_URL_KEY, trimmed)
}

// Labeled server profiles (e.g. "Home" / "Office") the user can save once
// and switch between with a tap instead of retyping the address.
export async function getSavedServers() {
  const stored = await AsyncStorage.getItem(SAVED_SERVERS_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

// Adds a new labeled server and immediately makes it the active one.
export async function addSavedServer(label, url) {
  const trimmedUrl = url.trim().replace(/\/+$/, '')
  const servers = await getSavedServers()
  const entry = { id: String(Date.now()), label: label.trim(), url: trimmedUrl }
  const updated = [...servers, entry]
  await AsyncStorage.setItem(SAVED_SERVERS_KEY, JSON.stringify(updated))
  await setApiBaseUrl(trimmedUrl)
  return entry
}

export async function deleteSavedServer(id) {
  const servers = await getSavedServers()
  const updated = servers.filter((server) => server.id !== id)
  return AsyncStorage.setItem(SAVED_SERVERS_KEY, JSON.stringify(updated))
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setToken(token) {
  return SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY)
}

export async function getTenantId() {
  return SecureStore.getItemAsync(TENANT_KEY)
}

export async function setTenantId(tenantId) {
  if (tenantId === null || tenantId === undefined) {
    return SecureStore.deleteItemAsync(TENANT_KEY)
  }
  return SecureStore.setItemAsync(TENANT_KEY, String(tenantId))
}

export async function apiFetch(path, options = {}) {
  const [token, baseUrl] = await Promise.all([getToken(), getApiBaseUrl()])
  const isFormData = options.body instanceof FormData

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      // FormData needs RN's networking layer to set its own multipart
      // boundary — forcing application/json here would corrupt the upload.
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
