import { DiagnoseResponse } from '../api'
import { CheckCircle, AlertTriangle, Info, Activity, ArrowRight, Shield, Stethoscope, Heart } from 'lucide-react'

// Función para determinar severidad basada en confianza
function getSeverityLevel(confidence: number): 'low' | 'medium' | 'high' {
  if (confidence >= 0.7) return 'high'
  if (confidence >= 0.4) return 'medium'
  return 'low'
}

function getSeverityStyles(level: 'low' | 'medium' | 'high') {
  const styles = {
    low: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
      icon: 'text-emerald-500',
      badge: 'bg-emerald-100 text-emerald-700'
    },
    medium: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
      icon: 'text-amber-500',
      badge: 'bg-amber-100 text-amber-700'
    },
    high: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      bar: 'bg-gradient-to-r from-rose-400 to-red-500',
      icon: 'text-rose-500',
      badge: 'bg-rose-100 text-rose-700'
    }
  }
  return styles[level]
}

export function Results({ data, onReset, lang = 'es' }: Readonly<{ data: DiagnoseResponse; onReset?: () => void; lang?: 'es' | 'en' }>) {
  const L = {
    es: { 
      title: 'Resultados del Análisis', 
      confidence: 'Confianza',
      recommendation: 'Recomendación',
      disclaimer: 'Nota: Este resultado es generado por IA y debe ser verificado por un médico.',
      new: 'Nuevo diagnóstico',
      low: 'Probabilidad Baja',
      medium: 'Probabilidad Media',
      high: 'Probabilidad Alta',
      analyzed: 'síntomas analizados',
      results: 'posibles diagnósticos'
    },
    en: { 
      title: 'Analysis Results', 
      confidence: 'Confidence',
      recommendation: 'Recommendation',
      disclaimer: 'Note: This result is AI-generated and should be verified by a doctor.',
      new: 'New diagnosis',
      low: 'Low Probability',
      medium: 'Medium Probability',
      high: 'High Probability',
      analyzed: 'symptoms analyzed',
      results: 'possible diagnoses'
    },
  } as const

  const severityLabels = { low: L[lang].low, medium: L[lang].medium, high: L[lang].high }

  return (
    <section className="space-y-6 animate-slide-up" aria-labelledby="results-title">
      {/* Header con estadísticas */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 id="results-title" className="text-2xl font-bold flex items-center gap-3">
              <Stethoscope className="opacity-80" />
              {L[lang].title}
            </h2>
            <p className="text-teal-100 mt-1">{data.diagnoses.length} {L[lang].results}</p>
          </div>
          {onReset && (
            <button 
              onClick={onReset} 
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl font-medium transition-all flex items-center gap-2"
            >
              <ArrowRight size={16} />
              {L[lang].new}
            </button>
          )}
        </div>
      </div>

      {/* Disclaimer mejorado */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800 animate-fade-in">
        <Shield className="shrink-0 text-blue-500" size={20} />
        <p>{data.disclaimer || L[lang].disclaimer}</p>
      </div>

      {/* Grid de resultados */}
      <div className="grid gap-4">
        {data.diagnoses.map((d, i) => {
          const severity = getSeverityLevel(d.confidence)
          const styles = getSeverityStyles(severity)
          
          return (
            <div 
              key={`${d.condition}-${i}`} 
              className={`bg-white rounded-2xl border ${styles.border} p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden card-hover animate-fade-in-up`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Indicador lateral de severidad */}
              <div className={`absolute top-0 left-0 w-1.5 h-full ${styles.bar}`}></div>
              
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
                <div className="flex-1">
                  {/* Badge de severidad */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${styles.badge}`}>
                    {severity === 'high' && <AlertTriangle size={12} />}
                    {severity === 'medium' && <Info size={12} />}
                    {severity === 'low' && <CheckCircle size={12} />}
                    {severityLabels[severity]}
                  </span>
                  
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{d.condition}</h3>
                  
                  {/* Barra de confianza mejorada */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${styles.bar} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${d.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-lg font-bold ${styles.text} min-w-[3rem] text-right`}>
                      {(d.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                {/* Icono decorativo */}
                <div className={`hidden lg:flex w-16 h-16 rounded-2xl ${styles.bg} items-center justify-center`}>
                  <Heart className={styles.icon} size={28} />
                </div>
              </div>

              {/* Recomendación */}
              <div className={`${styles.bg} rounded-xl p-4 border ${styles.border}`}>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Info size={12} /> {L[lang].recommendation}
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  {d.recommendation}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
