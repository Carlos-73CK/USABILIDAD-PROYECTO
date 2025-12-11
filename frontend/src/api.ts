export type Diagnosis = {
  condition: string
  confidence: number
  recommendation: string
}

export type DiagnoseResponse = {
  disclaimer: string
  diagnoses: Diagnosis[]
}

export type User = {
  id: number
  email: string
  full_name: string
  created_at: string
}

export type HistoryItem = {
  id: number
  date: string
  symptoms: string[]
  diagnoses: Diagnosis[]
}

const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

export async function register(email: string, password: string, full_name: string) {
  const res = await fetch(`${base}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Error en registro')
  }
  return res.json()
}

export async function resetPassword(email: string, new_password: string) {
  const res = await fetch(`${base}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, new_password }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Error al restablecer contraseña')
  }
  return res.json()
}

export async function login(username: string, password: string) {
  const formData = new URLSearchParams()
  formData.append('username', username)
  formData.append('password', password)

  const res = await fetch(`${base}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Error en inicio de sesión')
  }
  return res.json()
}

export async function getProfile(): Promise<User> {
  const res = await fetch(`${base}/users/me`, {
    headers: { ...getAuthHeader() }
  })
  if (!res.ok) throw new Error('Error al obtener perfil')
  return res.json()
}

export async function updateProfile(data: { full_name?: string, password?: string }) {
  const res = await fetch(`${base}/users/me`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader() 
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al actualizar perfil')
  return res.json()
}

export async function diagnose(symptoms: string[]): Promise<DiagnoseResponse> {
  const res = await fetch(`${base}/diagnose`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ symptoms }),
  })
  if (!res.ok) throw new Error('Error al obtener diagnóstico')
  return res.json()
}

export async function getHistory(): Promise<HistoryItem[]> {
  const res = await fetch(`${base}/history`, {
    headers: { ...getAuthHeader() }
  })
  if (!res.ok) throw new Error('Error al obtener historial')
  return res.json()
}

export async function deleteHistory(id: number) {
  const res = await fetch(`${base}/history/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  })
  if (!res.ok) throw new Error('Error al eliminar historial')
  return true
}
