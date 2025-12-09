import React, { useId, useState, useEffect } from 'react'

type Answer = 'yes' | 'no' | 'unknown'

type Props = Readonly<{
  disabled?: boolean
  onChange: (selectedSymptoms: string[], redFlags: string[]) => void
  lang?: 'es' | 'en'
}>

export function GuidedQuestions({ disabled, onChange, lang = 'es' }: Props) {
  const L = {
    es: {
      title: 'Preguntas guiadas',
      desc: 'Responde Sí/No. Esto ayuda a orientar mejor el resultado.',
      rfTitle: 'Señales de alerta (responde con atención)',
      qFever: '¿Tiene fiebre?',
      qCough: '¿Tiene tos?',
      qHeadache: '¿Dolor de cabeza?',
      qBreath: '¿Dificultad para respirar?',
      qChest: '¿Dolor en el pecho?',
      qConfusion: '¿Confusión o desorientación?',
      yes: 'Sí',
      no: 'No',
      hint: 'Use flechas izquierda/derecha para cambiar la opción',
      reset: 'Restablecer respuestas',
    },
    en: {
      title: 'Guided questions',
      desc: 'Answer Yes/No. This helps guide the result.',
      rfTitle: 'Red flags (answer carefully)',
      qFever: 'Do you have fever?',
      qCough: 'Do you have cough?',
      qHeadache: 'Headache?',
      qBreath: 'Difficulty breathing?',
      qChest: 'Chest pain?',
      qConfusion: 'Confusion or disorientation?',
      yes: 'Yes',
      no: 'No',
      hint: 'Use left/right arrows to change the option',
      reset: 'Reset answers',
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

  const helpId = useId()

  useEffect(() => {
    const positives: string[] = []
    if (fiebre === 'yes') positives.push('fiebre')
    if (tos === 'yes') positives.push('tos')
    if (dolorCabeza === 'yes') positives.push('dolor de cabeza')
    if (dificultadRespirar === 'yes') positives.push('dificultad para respirar')

    const red: string[] = []
    if (dolorPecho === 'yes') red.push('dolor en el pecho')
    if (confusion === 'yes') red.push('confusión')

    // Añadir red flags también a la lista de síntomas, para que el backend pueda considerarlos
    const all = [...positives, ...red]
    onChange(all, red)
  }, [fiebre, tos, dolorCabeza, dificultadRespirar, dolorPecho, confusion, onChange])

  return (
    <section className="grid gap-4" aria-labelledby="guided-title" aria-describedby={helpId}>
      <h2 id="guided-title" className="text-xl font-semibold">{L[lang].title}</h2>
      <p id={helpId} className="text-sm text-gray-700">{L[lang].desc}</p>

      <div className="grid gap-3">
        <QuestionBinary label={L[lang].qFever} name="fiebre" value={fiebre} onChange={setFiebre} disabled={disabled} lang={lang} />
        <QuestionBinary label={L[lang].qCough} name="tos" value={tos} onChange={setTos} disabled={disabled} lang={lang} />
        <QuestionBinary label={L[lang].qHeadache} name="dolor-cabeza" value={dolorCabeza} onChange={setDolorCabeza} disabled={disabled} lang={lang} />
        <QuestionBinary label={L[lang].qBreath} name="dificultad-respirar" value={dificultadRespirar} onChange={setDificultadRespirar} disabled={disabled} lang={lang} />
      </div>

      <div className="grid gap-3 mt-2">
        <h3 className="font-medium">{L[lang].rfTitle}</h3>
        <QuestionBinary label={L[lang].qChest} name="dolor-pecho" value={dolorPecho} onChange={setDolorPecho} disabled={disabled} lang={lang} />
        <QuestionBinary label={L[lang].qConfusion} name="confusion" value={confusion} onChange={setConfusion} disabled={disabled} lang={lang} />
        <div>
          <button
            type="button"
            className="btn"
            disabled={disabled}
            onClick={() => {
              setFiebre('unknown'); setTos('unknown'); setDolorCabeza('unknown'); setDificultadRespirar('unknown'); setDolorPecho('unknown'); setConfusion('unknown')
            }}
          >↺ {L[lang].reset}</button>
        </div>
      </div>
    </section>
  )
}

function QuestionBinary({ label, name, value, onChange, disabled, lang = 'es' }: Readonly<{ label: string; name: string; value: Answer; onChange: (a: Answer) => void; disabled?: boolean; lang?: 'es' | 'en' }>) {
  const groupId = useId()
  return (
    <fieldset aria-describedby={`${groupId}-hint`}>
      <legend className="mb-1">{label}</legend>
      <div id={`${groupId}-hint`} className="sr-only">{lang === 'en' ? 'Use left/right arrows to change the option' : 'Use flechas izquierda/derecha para cambiar la opción'}</div>
      <div className="flex gap-6 items-center">
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name={name}
            value="yes"
            checked={value === 'yes'}
            onChange={() => onChange('yes')}
            disabled={disabled}
            className="h-4 w-4"
          />
          <span>{lang === 'en' ? 'Yes' : 'Sí'}</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name={name}
            value="no"
            checked={value === 'no'}
            onChange={() => onChange('no')}
            disabled={disabled}
            className="h-4 w-4"
          />
          <span>No</span>
        </label>
      </div>
    </fieldset>
  )
}
