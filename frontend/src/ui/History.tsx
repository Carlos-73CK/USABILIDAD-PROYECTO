import React, { useEffect, useState } from 'react'
import { getHistory, deleteHistory, HistoryItem } from '../api'

export function History({ lang = 'es' }: Readonly<{ lang?: 'es' | 'en' }>) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const L = {
    es: { title: 'Historial reciente', refresh: 'Actualizar', loading: 'cargando…', none: 'No hay registros.', symptoms: 'Síntomas', probable: 'Probable', recs: 'Recomendaciones', delete: 'Eliminar' },
    en: { title: 'Recent history', refresh: 'Refresh', loading: 'loading…', none: 'No records.', symptoms: 'Symptoms', probable: 'Likely', recs: 'Recommendations', delete: 'Delete' },
  } as const

  async function onDelete(id: string) {
    const ok = await deleteHistory(id)
    if (ok) setItems((prev) => prev.filter((x) => x.id !== id))
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getHistory()
      setItems(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <section className="max-w-3xl mx-auto grid gap-3" aria-labelledby="history-title">
      <div className="flex items-center justify-between">
        <h2 id="history-title" className="text-xl font-semibold">{L[lang].title}</h2>
        <button onClick={load} className="btn">{L[lang].refresh}</button>
      </div>
      {loading && <p>{L[lang].loading}</p>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <ul className="divide-y">
        {items.map((it) => (
          <li key={it.id} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="grid gap-1">
                <div className="text-sm text-gray-700">{new Date(it.created_at).toLocaleString(lang === 'en' ? 'en' : 'es')}</div>
                <div className="text-sm">{L[lang].symptoms}: {it.input_symptoms.join(', ')}</div>
                {it.result?.diagnoses?.length > 0 && (
                  <>
                    <div className="text-sm"><span className="font-medium">{L[lang].probable}:</span> {it.result.diagnoses[0].condition} ({Math.round(it.result.diagnoses[0].confidence * 100)}%)</div>
                    <div className="text-sm"><span className="font-medium">{L[lang].recs}:</span> {it.result.diagnoses[0].recommendation}</div>
                  </>
                )}
              </div>
              <div>
                <button
                  className="btn"
                  aria-label={`${L[lang].delete} ${new Date(it.created_at).toLocaleString(lang === 'en' ? 'en' : 'es')}`}
                  title={L[lang].delete}
                  onClick={() => onDelete(it.id)}
                >🗑️</button>
              </div>
            </div>
          </li>
        ))}
        {items.length === 0 && !loading && !error && (
          <li className="py-2 text-gray-600">{L[lang].none}</li>
        )}
      </ul>
    </section>
  )}
