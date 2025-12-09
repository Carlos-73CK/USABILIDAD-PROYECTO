export type Diagnosis = {
  condition: string
  confidence: number
  recommendation: string
}

export type DiagnoseResponse = {
  disclaimer: string
  diagnoses: Diagnosis[]
}

const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function diagnose(symptoms: string[]): Promise<DiagnoseResponse> {
  const res = await fetch(`${base}/diagnose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symptoms }),
  })
  if (!res.ok) throw new Error('Error al obtener diagnóstico')
  return res.json()
}

export type HistoryItem = {
  id: string
  user_id?: string | null
  input_symptoms: string[]
  result: DiagnoseResponse
  created_at: string
}

export async function getHistory(): Promise<HistoryItem[]> {
  const res = await fetch(`${base}/history`)
  if (!res.ok) throw new Error('Error al obtener historial')
  const data = await res.json()
  return data.items as HistoryItem[]
}

export async function deleteHistory(id: string): Promise<boolean> {
  const res = await fetch(`${base}/history/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) return false
  const data = await res.json().catch(() => ({ ok: false }))
  return !!data.ok
}
