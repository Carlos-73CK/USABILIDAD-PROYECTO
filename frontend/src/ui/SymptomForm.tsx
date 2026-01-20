import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Plus, X, Search, ArrowRight } from 'lucide-react'

// Lista de síntomas conocidos para autocompletado
const KNOWN_SYMPTOMS = [
  // Generales
  'fiebre', 'fiebre alta', 'fiebre leve', 'escalofríos', 'sudoración nocturna',
  'fatiga', 'cansancio', 'debilidad', 'malestar general', 'pérdida de peso',
  'pérdida de apetito', 'sed excesiva', 'deshidratación',
  
  // Respiratorios
  'tos', 'tos seca', 'tos con flema', 'dificultad para respirar', 'falta de aire',
  'sibilancias', 'dolor al respirar', 'congestión nasal', 'secreción nasal',
  'estornudos', 'ronquera', 'dolor de garganta', 'garganta irritada',
  
  // Cabeza y neurológicos
  'dolor de cabeza', 'cefalea', 'migraña', 'mareo', 'vértigo', 'náuseas',
  'vómitos', 'confusión', 'pérdida de memoria', 'dificultad para concentrarse',
  'visión borrosa', 'sensibilidad a la luz', 'zumbido en oídos',
  
  // Digestivos
  'dolor abdominal', 'dolor de estómago', 'acidez', 'reflujo', 'hinchazón abdominal',
  'gases', 'diarrea', 'estreñimiento', 'sangre en heces', 'náuseas', 'vómitos',
  'pérdida de apetito', 'dificultad para tragar',
  
  // Musculoesqueléticos
  'dolor muscular', 'dolor de espalda', 'dolor lumbar', 'dolor de cuello',
  'rigidez muscular', 'calambres', 'dolor articular', 'inflamación articular',
  'debilidad muscular', 'dolor en extremidades', 'entumecimiento', 'hormigueo',
  
  // Piel
  'erupción cutánea', 'picazón', 'urticaria', 'enrojecimiento de piel',
  'piel seca', 'descamación', 'ampollas', 'moretones', 'palidez',
  
  // Cardiovasculares
  'dolor en el pecho', 'palpitaciones', 'taquicardia', 'presión arterial alta',
  'hinchazón de piernas', 'hinchazón de tobillos', 'falta de aire al acostarse',
  
  // Urinarios
  'ardor al orinar', 'micción frecuente', 'urgencia urinaria', 'sangre en orina',
  'orina oscura', 'dolor en riñones', 'incontinencia',
  
  // Ojos y oídos
  'ojos rojos', 'lagrimeo', 'secreción ocular', 'dolor de oído',
  'pérdida de audición', 'picazón en ojos', 'sensibilidad a la luz',
  
  // Psicológicos
  'ansiedad', 'nerviosismo', 'tristeza', 'insomnio', 'dificultad para dormir',
  'irritabilidad', 'cambios de humor', 'falta de energía', 'estrés',
  
  // Otros
  'ganglios inflamados', 'pérdida del olfato', 'pérdida del gusto',
  'dolor de mandíbula', 'sangrado de encías', 'mal aliento'
]

type Props = Readonly<{
  onSubmit: (symptoms: string[]) => void
  disabled?: boolean
  lang?: 'es' | 'en'
}>

export function SymptomForm({ onSubmit, disabled, lang = 'es' }: Props) {
  const [input, setInput] = useState('')
  const [list, setList] = useState<string[]>([])
  const [listening, setListening] = useState(false)
  
  // Estados para autocompletado
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Filtrar sugerencias basadas en el input
  useEffect(() => {
    if (input.trim().length >= 2) {
      const filtered = KNOWN_SYMPTOMS.filter(symptom => 
        symptom.toLowerCase().includes(input.toLowerCase()) &&
        !list.includes(symptom)
      ).slice(0, 8) // Limitar a 8 sugerencias
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
      setSelectedIndex(-1)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [input, list])

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectSuggestion(symptom: string) {
    if (!list.includes(symptom)) {
      setList(l => [...l, symptom])
    }
    setInput('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1))
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault()
        selectSuggestion(suggestions[selectedIndex])
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
      } else if (e.key === 'Enter' && selectedIndex === -1) {
        e.preventDefault()
        addSymptom()
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      addSymptom()
    }
  }

  const L = {
    es: {
      symptom: 'Describe tus síntomas',
      add: 'Añadir',
      remove: 'Quitar',
      submit: 'Analizar Síntomas',
      help: 'Escribe un síntoma y verás sugerencias automáticas. También puedes dictar por voz.',
      placeholder: 'Ej.: fiebre, dolor de cabeza, tos...',
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
      help: 'Type a symptom and see automatic suggestions. You can also use voice dictation.',
      placeholder: 'E.g.: fever, headache, cough...',
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
            <input
              ref={inputRef}
              id="symptom"
              name="symptom"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
              aria-describedby="symptom-help"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              disabled={disabled}
              placeholder={L[lang].placeholder}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true)
              }}
              autoComplete="off"
            />
            
            {/* Dropdown de sugerencias */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-fade-in"
                role="listbox"
              >
                <div className="p-2 text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                  💡 Sugerencias ({suggestions.length})
                </div>
                {suggestions.map((symptom, index) => (
                  <button
                    key={symptom}
                    type="button"
                    role="option"
                    aria-selected={index === selectedIndex}
                    className={`
                      w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2
                      ${index === selectedIndex 
                        ? 'bg-teal-50 text-teal-700' 
                        : 'hover:bg-slate-50 text-slate-700'
                      }
                    `}
                    onClick={() => selectSuggestion(symptom)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span className="text-teal-500">+</span>
                    <span>{symptom}</span>
                  </button>
                ))}
                <div className="p-2 text-xs text-slate-400 border-t border-slate-100 bg-slate-50">
                  ↑↓ navegar • Enter seleccionar • Esc cerrar
                </div>
              </div>
            )}
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
