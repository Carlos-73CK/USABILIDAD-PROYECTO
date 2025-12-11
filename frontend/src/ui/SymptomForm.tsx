import { useState } from 'react'
import { Mic, MicOff, Plus, X, Search, ArrowRight } from 'lucide-react'

type Props = Readonly<{
  onSubmit: (symptoms: string[]) => void
  disabled?: boolean
  lang?: 'es' | 'en'
}>

export function SymptomForm({ onSubmit, disabled, lang = 'es' }: Props) {
  const [input, setInput] = useState('')
  const [list, setList] = useState<string[]>([])
  const [listening, setListening] = useState(false)

  const L = {
    es: {
      symptom: 'Describe tus síntomas',
      add: 'Añadir',
      remove: 'Quitar',
      submit: 'Analizar Síntomas',
      help: 'Escribe un síntoma y pulsa «Añadir». Ej.: fiebre, tos.',
      placeholder: 'Ej.: fiebre alta, dolor de cabeza...',
      mic: 'Dictar',
      micOn: 'Escuchando...',
      empty: 'Añade al menos un síntoma para continuar.',
      added: 'Síntomas añadidos:'
    },
    en: {
      symptom: 'Describe your symptoms',
      add: 'Add',
      remove: 'Remove',
      submit: 'Analyze Symptoms',
      help: 'Type a symptom and click “Add”. E.g.: fever, cough.',
      placeholder: 'E.g.: high fever, headache...',
      mic: 'Dictate',
      micOn: 'Listening...',
      empty: 'Add at least one symptom to continue.',
      added: 'Added symptoms:'
    },
  } as const

  function toggleListening() {
    if (listening) return 
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta dictado por voz.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang === 'en' ? 'en-US' : 'es-ES'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      if (transcript) {
        setInput((prev) => (prev ? prev + ' ' + transcript : transcript))
      }
    }

    recognition.start()
  }

  function addSymptom() {
    const v = input.trim()
    if (v && !list.includes(v)) setList((l) => [...l, v])
    setInput('')
  }

  function removeSymptom(s: string) {
    setList((l) => l.filter((x) => x !== s))
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit(list)
  }

  return (
    <form onSubmit={submit} aria-describedby="symptom-help" className="space-y-6">
      
      <div className="space-y-2">
        <label htmlFor="symptom" className="font-medium text-slate-700 block">{L[lang].symptom}</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              id="symptom"
              name="symptom"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
              aria-describedby="symptom-help"
              disabled={disabled}
              placeholder={L[lang].placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSymptom()
                }
              }}
            />
          </div>
          
          <button
            type="button"
            onClick={toggleListening}
            className={`
              px-4 rounded-xl border transition-all flex items-center gap-2 font-medium
              ${listening 
                ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-teal-600'
              }
            `}
            disabled={disabled}
            aria-label={listening ? L[lang].micOn : L[lang].mic}
            title={L[lang].mic}
          >
            {listening ? <MicOff size={20} /> : <Mic size={20} />}
            <span className="hidden sm:inline">{listening ? L[lang].micOn : L[lang].mic}</span>
          </button>

          <button
            type="button"
            onClick={addSymptom}
            disabled={!input.trim() || disabled}
            className="bg-teal-600 text-white px-6 rounded-xl font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">{L[lang].add}</span>
          </button>
        </div>
        <p id="symptom-help" className="text-sm text-slate-500">{L[lang].help}</p>
      </div>

      {list.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 animate-fade-in">
          <p className="text-sm font-medium text-slate-700 mb-3">{L[lang].added}</p>
          <div className="flex flex-wrap gap-2">
            {list.map((s) => (
              <span key={s} className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 shadow-sm animate-scale-in">
                <span>{s}</span>
                <button
                  type="button"
                  onClick={() => removeSymptom(s)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded-md hover:bg-red-50"
                  aria-label={`${L[lang].remove} ${s}`}
                  disabled={disabled}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4">
        <button 
          type="submit" 
          className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-teal-200 hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          disabled={list.length === 0 || disabled}
        >
          <span>{L[lang].submit}</span>
          <ArrowRight size={20} />
        </button>
        {list.length === 0 && (
          <p className="text-center text-sm text-slate-400 mt-2">{L[lang].empty}</p>
        )}
      </div>
    </form>
  )
}
