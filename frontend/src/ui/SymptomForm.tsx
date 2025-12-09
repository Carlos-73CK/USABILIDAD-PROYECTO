import { useState } from 'react'

type Props = Readonly<{
  onSubmit: (symptoms: string[]) => void
  disabled?: boolean
  lang?: 'es' | 'en'
}>

export function SymptomForm({ onSubmit, disabled, lang = 'es' }: Props) {
  const [input, setInput] = useState('')
  const [list, setList] = useState<string[]>([])
  const L = {
    es: {
      symptom: 'Síntoma',
      add: 'Añadir',
      remove: 'Quitar',
      submit: 'Obtener diagnóstico',
      help: 'Escribe un síntoma y pulsa «Añadir». Ej.: fiebre, tos.',
      placeholder: 'Ej.: fiebre, tos',
    },
    en: {
      symptom: 'Symptom',
      add: 'Add',
      remove: 'Remove',
      submit: 'Get diagnosis',
      help: 'Type a symptom and click “Add”. E.g.: fever, cough.',
      placeholder: 'E.g.: fever, cough',
    },
  } as const

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
    <form onSubmit={submit} aria-describedby="symptom-help" className="grid gap-3">
      <label htmlFor="symptom" className="font-medium">{L[lang].symptom}</label>
      <div className="flex gap-2">
        <input
          id="symptom"
          name="symptom"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="input w-full"
          aria-describedby="symptom-help"
          disabled={disabled}
          placeholder={L[lang].placeholder}
        />
        <button type="button" onClick={addSymptom} className="btn" disabled={disabled}>
          {L[lang].add}
        </button>
      </div>
  <p id="symptom-help" className="text-sm text-gray-700">{L[lang].help}</p>

      {list.length > 0 && (
        <ul className="list-disc pl-6">
          {list.map((s) => (
            <li key={s} className="flex items-center gap-2">
              <span>{s}</span>
              <button type="button" onClick={() => removeSymptom(s)} className="text-sm text-red-700 underline" aria-label={`${L[lang].remove} síntoma ${s}`} disabled={disabled}>
                {L[lang].remove}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <button type="submit" className="btn btn-primary" disabled={disabled || list.length === 0}>
          {L[lang].submit}
        </button>
      </div>
    </form>
  )
}
