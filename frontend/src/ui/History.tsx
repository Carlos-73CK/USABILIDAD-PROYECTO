import React, { useEffect, useState } from 'react'
import { getHistory, deleteHistory, HistoryItem } from '../api'
import { Trash2, Clock, Calendar, Activity, AlertCircle, RefreshCw } from 'lucide-react'

export function History({ lang = 'es' }: Readonly<{ lang?: 'es' | 'en' }>) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const L = {
    es: { 
      title: 'Historial de Diagnósticos', 
      refresh: 'Actualizar', 
      loading: 'Cargando historial...', 
      none: 'No hay registros guardados.', 
      symptoms: 'Síntomas reportados', 
      probable: 'Diagnóstico probable', 
      recs: 'Recomendación', 
      delete: 'Eliminar registro',
      date: 'Fecha'
    },
    en: { 
      title: 'Diagnosis History', 
      refresh: 'Refresh', 
      loading: 'Loading history...', 
      none: 'No saved records.', 
      symptoms: 'Reported symptoms', 
      probable: 'Likely diagnosis', 
      recs: 'Recommendation', 
      delete: 'Delete record',
      date: 'Date'
    },
  } as const

  async function onDelete(id: number) {
    if (!confirm(lang === 'es' ? '¿Estás seguro de eliminar este registro?' : 'Are you sure you want to delete this record?')) return
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
    <section className="max-w-4xl mx-auto space-y-6 animate-slide-up" aria-labelledby="history-title">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 id="history-title" className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Clock className="text-teal-600" />
          {L[lang].title}
        </h2>
        <button 
          onClick={load} 
          className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-50 rounded-full transition-all"
          title={L[lang].refresh}
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3" role="alert">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {items.map((it) => (
          <div key={it.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex flex-col md:flex-row gap-6">
              
              {/* Date Column */}
              <div className="md:w-48 shrink-0 flex flex-col gap-1 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <Calendar size={14} />
                  {L[lang].date}
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {new Date(it.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="text-sm text-slate-400">
                  {new Date(it.date).toLocaleTimeString(lang === 'en' ? 'en-US' : 'es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Content Column */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{L[lang].symptoms}</h3>
                  <div className="flex flex-wrap gap-2">
                    {it.symptoms.map((s, i) => (
                      <span key={i} className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {it.diagnoses?.length > 0 && (
                  <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity size={16} className="text-teal-600" />
                      <span className="font-bold text-teal-900">{it.diagnoses[0].condition}</span>
                      <span className="text-xs bg-teal-200 text-teal-800 px-2 py-0.5 rounded-full font-medium">
                        {Math.round(it.diagnoses[0].confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-sm text-teal-800 leading-relaxed">
                      {it.diagnoses[0].recommendation}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-start justify-end">
                <button
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label={L[lang].delete}
                  title={L[lang].delete}
                  onClick={() => onDelete(it.id)}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && !loading && !error && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Clock size={32} />
            </div>
            <p className="text-slate-500 font-medium">{L[lang].none}</p>
          </div>
        )}
      </div>
    </section>
  )
}
