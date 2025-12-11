import { DiagnoseResponse } from '../api'
import { CheckCircle, AlertTriangle, Info, Activity, ArrowRight } from 'lucide-react'

export function Results({ data, onReset, lang = 'es' }: Readonly<{ data: DiagnoseResponse; onReset?: () => void; lang?: 'es' | 'en' }>) {
  const L = {
    es: { 
      title: 'Resultados del Análisis', 
      confidence: 'Confianza',
      recommendation: 'Recomendación',
      disclaimer: 'Nota: Este resultado es generado por IA y debe ser verificado por un médico.',
      new: 'Nuevo diagnóstico'
    },
    en: { 
      title: 'Analysis Results', 
      confidence: 'Confidence',
      recommendation: 'Recommendation',
      disclaimer: 'Note: This result is AI-generated and should be verified by a doctor.',
      new: 'New diagnosis'
    },
  } as const

  return (
    <section className="space-y-6 animate-slide-up" aria-labelledby="results-title">
      <div className="flex items-center justify-between">
        <h2 id="results-title" className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Activity className="text-teal-600" />
          {L[lang].title}
        </h2>
        {onReset && (
          <button onClick={onReset} className="text-sm text-teal-600 hover:underline font-medium">
            {L[lang].new}
          </button>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800">
        <Info className="shrink-0" size={20} />
        <p>{data.disclaimer || L[lang].disclaimer}</p>
      </div>

      <div className="grid gap-4">
        {data.diagnoses.map((d, i) => (
          <div 
            key={`${d.condition}-${i}`} 
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{d.condition}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle size={14} className="text-teal-500" />
                  <span>{L[lang].confidence}:</span>
                  <span className="font-semibold text-slate-700">{(d.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              {/* Confidence Bar */}
              <div className="w-full md:w-32 h-2 bg-slate-100 rounded-full overflow-hidden mt-2 md:mt-0">
                <div 
                  className="h-full bg-teal-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${d.confidence * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Info size={12} /> {L[lang].recommendation}
              </h4>
              <p className="text-slate-700 leading-relaxed">
                {d.recommendation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
