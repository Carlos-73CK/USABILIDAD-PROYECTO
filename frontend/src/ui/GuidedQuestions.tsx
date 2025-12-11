import React, { useId, useState, useEffect } from 'react'
import { Check, X, RotateCcw, AlertTriangle, HelpCircle } from 'lucide-react'

type Answer = 'yes' | 'no' | 'unknown'

type Props = Readonly<{
  disabled?: boolean
  onChange: (selectedSymptoms: string[], redFlags: string[]) => void
  lang?: 'es' | 'en'
}>

export function GuidedQuestions({ disabled, onChange, lang = 'es' }: Props) {
  const L = {
    es: {
      title: 'Cuestionario Inicial',
      desc: 'Responde estas preguntas rápidas para orientar el diagnóstico.',
      rfTitle: 'Señales de Alerta',
      rfDesc: 'Por favor, responde con especial atención.',
      qFever: '¿Tiene fiebre?',
      qCough: '¿Tiene tos persistente?',
      qHeadache: '¿Dolor de cabeza intenso?',
      qBreath: '¿Dificultad para respirar?',
      qChest: '¿Dolor o presión en el pecho?',
      qConfusion: '¿Confusión repentina?',
      yes: 'Sí',
      no: 'No',
      reset: 'Reiniciar cuestionario',
    },
    en: {
      title: 'Initial Questionnaire',
      desc: 'Answer these quick questions to guide the diagnosis.',
      rfTitle: 'Red Flags',
      rfDesc: 'Please answer with special attention.',
      qFever: 'Do you have a fever?',
      qCough: 'Do you have a persistent cough?',
      qHeadache: 'Severe headache?',
      qBreath: 'Difficulty breathing?',
      qChest: 'Chest pain or pressure?',
      qConfusion: 'Sudden confusion?',
      yes: 'Yes',
      no: 'No',
      reset: 'Reset questionnaire',
    },
  } as const

  // Preguntas base
  const [fiebre, setFiebre] = useState<Answer>('unknown')
  const [tos, setTos] = useState<Answer>('unknown')
  const [dolorCabeza, setDolorCabeza] = useState<Answer>('unknown')
  const [dificultadRespirar, setDificultadRespirar] = useState<Answer>('unknown')

  // Red flags
  const [dolorPecho, setDolorPecho] = useState<Answer>('unknown')
  const [confusion, setConfusion] = useState<Answer>('unknown')

  useEffect(() => {
    const positives: string[] = []
    if (fiebre === 'yes') positives.push('fiebre')
    if (tos === 'yes') positives.push('tos')
    if (dolorCabeza === 'yes') positives.push('dolor de cabeza')
    if (dificultadRespirar === 'yes') positives.push('dificultad para respirar')

    const red: string[] = []
    if (dolorPecho === 'yes') red.push('dolor en el pecho')
    if (confusion === 'yes') red.push('confusión')

    const all = [...positives, ...red]
    onChange(all, red)
  }, [fiebre, tos, dolorCabeza, dificultadRespirar, dolorPecho, confusion, onChange])

  const reset = () => {
    setFiebre('unknown'); setTos('unknown'); setDolorCabeza('unknown'); 
    setDificultadRespirar('unknown'); setDolorPecho('unknown'); setConfusion('unknown')
  }

  return (
    <section className="space-y-8" aria-labelledby="guided-title">
      
      <div className="grid gap-4">
        <QuestionCard label={L[lang].qFever} value={fiebre} onChange={setFiebre} disabled={disabled} lang={lang} />
        <QuestionCard label={L[lang].qCough} value={tos} onChange={setTos} disabled={disabled} lang={lang} />
        <QuestionCard label={L[lang].qHeadache} value={dolorCabeza} onChange={setDolorCabeza} disabled={disabled} lang={lang} />
        <QuestionCard label={L[lang].qBreath} value={dificultadRespirar} onChange={setDificultadRespirar} disabled={disabled} lang={lang} />
      </div>

      <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
        <div className="flex items-center gap-3 mb-4 text-red-800">
          <AlertTriangle size={20} />
          <div>
            <h3 className="font-bold">{L[lang].rfTitle}</h3>
            <p className="text-xs text-red-600">{L[lang].rfDesc}</p>
          </div>
        </div>
        <div className="grid gap-4">
          <QuestionCard label={L[lang].qChest} value={dolorPecho} onChange={setDolorPecho} disabled={disabled} lang={lang} isRedFlag />
          <QuestionCard label={L[lang].qConfusion} value={confusion} onChange={setConfusion} disabled={disabled} lang={lang} isRedFlag />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="text-slate-500 hover:text-teal-600 text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          disabled={disabled}
          onClick={reset}
        >
          <RotateCcw size={16} />
          {L[lang].reset}
        </button>
      </div>
    </section>
  )
}

function QuestionCard({ label, value, onChange, disabled, lang = 'es', isRedFlag }: any) {
  const id = useId()
  return (
    <div className={`
      flex items-center justify-between p-4 rounded-xl border transition-all
      ${value !== 'unknown' 
        ? (isRedFlag ? 'bg-white border-red-200 shadow-sm' : 'bg-white border-teal-200 shadow-sm') 
        : (isRedFlag ? 'bg-white/50 border-red-100' : 'bg-slate-50 border-slate-100')
      }
    `}>
      <label className={`font-medium ${isRedFlag ? 'text-red-900' : 'text-slate-700'}`}>{label}</label>
      
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange('yes')}
          disabled={disabled}
          className={`
            w-10 h-10 rounded-lg flex items-center justify-center transition-all border
            ${value === 'yes' 
              ? (isRedFlag ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-teal-600 text-white border-teal-600 shadow-md') 
              : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
            }
          `}
          aria-label={lang === 'en' ? 'Yes' : 'Sí'}
        >
          <Check size={20} />
        </button>
        
        <button
          type="button"
          onClick={() => onChange('no')}
          disabled={disabled}
          className={`
            w-10 h-10 rounded-lg flex items-center justify-center transition-all border
            ${value === 'no' 
              ? 'bg-slate-600 text-white border-slate-600 shadow-md' 
              : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
            }
          `}
          aria-label="No"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
