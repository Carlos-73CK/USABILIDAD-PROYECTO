import React, { useId, useState, useEffect } from 'react'
import { Check, X, RotateCcw, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

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
      // Síntomas generales
      qFever: '¿Tiene fiebre?',
      qCough: '¿Tiene tos persistente?',
      qHeadache: '¿Dolor de cabeza intenso?',
      qBreath: '¿Dificultad para respirar?',
      // Gastrointestinales
      qNausea: '¿Náuseas o vómitos?',
      qAbdominal: '¿Dolor abdominal?',
      qDiarrhea: '¿Diarrea?',
      // Musculoesqueléticos
      qMuscle: '¿Dolor muscular o articular?',
      qBack: '¿Dolor de espalda?',
      // ORL
      qThroat: '¿Dolor de garganta?',
      qCongestion: '¿Congestión nasal?',
      qEar: '¿Dolor de oído?',
      // Neurológicos
      qDizziness: '¿Mareos o vértigo?',
      qVision: '¿Problemas de visión?',
      // Piel
      qRash: '¿Erupción o irritación en la piel?',
      qItching: '¿Picazón intensa?',
      // Otros
      qFatigue: '¿Fatiga extrema?',
      qUrinary: '¿Ardor o dolor al orinar?',
      // Red flags
      qChest: '¿Dolor o presión en el pecho?',
      qConfusion: '¿Confusión repentina?',
      qBlood: '¿Sangrado inusual?',
      qFainting: '¿Desmayo o pérdida de conciencia?',
      // UI
      yes: 'Sí',
      no: 'No',
      reset: 'Reiniciar cuestionario',
      showMore: 'Ver más síntomas',
      showLess: 'Ver menos',
      sectionGeneral: 'Síntomas Generales',
      sectionDigestive: 'Digestivos',
      sectionPain: 'Dolor y Músculos',
      sectionOrl: 'Oído, Nariz, Garganta',
      sectionOther: 'Otros Síntomas',
    },
    en: {
      title: 'Initial Questionnaire',
      desc: 'Answer these quick questions to guide the diagnosis.',
      rfTitle: 'Red Flags',
      rfDesc: 'Please answer with special attention.',
      // General symptoms
      qFever: 'Do you have a fever?',
      qCough: 'Do you have a persistent cough?',
      qHeadache: 'Severe headache?',
      qBreath: 'Difficulty breathing?',
      // Gastrointestinal
      qNausea: 'Nausea or vomiting?',
      qAbdominal: 'Abdominal pain?',
      qDiarrhea: 'Diarrhea?',
      // Musculoskeletal
      qMuscle: 'Muscle or joint pain?',
      qBack: 'Back pain?',
      // ORL
      qThroat: 'Sore throat?',
      qCongestion: 'Nasal congestion?',
      qEar: 'Ear pain?',
      // Neurological
      qDizziness: 'Dizziness or vertigo?',
      qVision: 'Vision problems?',
      // Skin
      qRash: 'Skin rash or irritation?',
      qItching: 'Intense itching?',
      // Other
      qFatigue: 'Extreme fatigue?',
      qUrinary: 'Burning or pain when urinating?',
      // Red flags
      qChest: 'Chest pain or pressure?',
      qConfusion: 'Sudden confusion?',
      qBlood: 'Unusual bleeding?',
      qFainting: 'Fainting or loss of consciousness?',
      // UI
      yes: 'Yes',
      no: 'No',
      reset: 'Reset questionnaire',
      showMore: 'Show more symptoms',
      showLess: 'Show less',
      sectionGeneral: 'General Symptoms',
      sectionDigestive: 'Digestive',
      sectionPain: 'Pain and Muscles',
      sectionOrl: 'Ear, Nose, Throat',
      sectionOther: 'Other Symptoms',
    },
  } as const

  const [showMore, setShowMore] = useState(false)

  // Preguntas generales (siempre visibles)
  const [fiebre, setFiebre] = useState<Answer>('unknown')
  const [tos, setTos] = useState<Answer>('unknown')
  const [dolorCabeza, setDolorCabeza] = useState<Answer>('unknown')
  const [dificultadRespirar, setDificultadRespirar] = useState<Answer>('unknown')
  
  // Gastrointestinales
  const [nausea, setNausea] = useState<Answer>('unknown')
  const [dolorAbdominal, setDolorAbdominal] = useState<Answer>('unknown')
  const [diarrea, setDiarrea] = useState<Answer>('unknown')
  
  // Musculoesqueléticos
  const [dolorMuscular, setDolorMuscular] = useState<Answer>('unknown')
  const [dolorEspalda, setDolorEspalda] = useState<Answer>('unknown')
  
  // ORL
  const [dolorGarganta, setDolorGarganta] = useState<Answer>('unknown')
  const [congestion, setCongestion] = useState<Answer>('unknown')
  const [dolorOido, setDolorOido] = useState<Answer>('unknown')
  
  // Neurológicos
  const [mareo, setMareo] = useState<Answer>('unknown')
  const [problemaVision, setProblemaVision] = useState<Answer>('unknown')
  
  // Piel
  const [erupcion, setErupcion] = useState<Answer>('unknown')
  const [picazon, setPicazon] = useState<Answer>('unknown')
  
  // Otros
  const [fatiga, setFatiga] = useState<Answer>('unknown')
  const [ardorOrinar, setArdorOrinar] = useState<Answer>('unknown')

  // Red flags
  const [dolorPecho, setDolorPecho] = useState<Answer>('unknown')
  const [confusion, setConfusion] = useState<Answer>('unknown')
  const [sangrado, setSangrado] = useState<Answer>('unknown')
  const [desmayo, setDesmayo] = useState<Answer>('unknown')

  useEffect(() => {
    const positives: string[] = []
    // Generales
    if (fiebre === 'yes') positives.push('fiebre')
    if (tos === 'yes') positives.push('tos')
    if (dolorCabeza === 'yes') positives.push('dolor de cabeza')
    if (dificultadRespirar === 'yes') positives.push('dificultad para respirar')
    // Gastrointestinales
    if (nausea === 'yes') positives.push('nauseas')
    if (dolorAbdominal === 'yes') positives.push('dolor abdominal')
    if (diarrea === 'yes') positives.push('diarrea')
    // Musculoesqueléticos
    if (dolorMuscular === 'yes') positives.push('dolor muscular')
    if (dolorEspalda === 'yes') positives.push('dolor de espalda')
    // ORL
    if (dolorGarganta === 'yes') positives.push('dolor de garganta')
    if (congestion === 'yes') positives.push('congestion nasal')
    if (dolorOido === 'yes') positives.push('dolor de oido')
    // Neurológicos
    if (mareo === 'yes') positives.push('mareo')
    if (problemaVision === 'yes') positives.push('vision borrosa')
    // Piel
    if (erupcion === 'yes') positives.push('erupcion cutanea')
    if (picazon === 'yes') positives.push('picazon en piel')
    // Otros
    if (fatiga === 'yes') positives.push('fatiga extrema')
    if (ardorOrinar === 'yes') positives.push('ardor al orinar')

    const red: string[] = []
    if (dolorPecho === 'yes') red.push('dolor de pecho')
    if (confusion === 'yes') red.push('confusion')
    if (sangrado === 'yes') red.push('sangrado')
    if (desmayo === 'yes') red.push('desmayo')

    const all = [...positives, ...red]
    onChange(all, red)
  }, [fiebre, tos, dolorCabeza, dificultadRespirar, nausea, dolorAbdominal, diarrea, 
      dolorMuscular, dolorEspalda, dolorGarganta, congestion, dolorOido, mareo, 
      problemaVision, erupcion, picazon, fatiga, ardorOrinar, dolorPecho, confusion, 
      sangrado, desmayo, onChange])

  const reset = () => {
    setFiebre('unknown'); setTos('unknown'); setDolorCabeza('unknown'); 
    setDificultadRespirar('unknown'); setNausea('unknown'); setDolorAbdominal('unknown');
    setDiarrea('unknown'); setDolorMuscular('unknown'); setDolorEspalda('unknown');
    setDolorGarganta('unknown'); setCongestion('unknown'); setDolorOido('unknown');
    setMareo('unknown'); setProblemaVision('unknown'); setErupcion('unknown');
    setPicazon('unknown'); setFatiga('unknown'); setArdorOrinar('unknown');
    setDolorPecho('unknown'); setConfusion('unknown'); setSangrado('unknown'); setDesmayo('unknown')
  }

  return (
    <section className="space-y-6" aria-labelledby="guided-title">
      
      {/* Síntomas Generales - Siempre visibles */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{L[lang].sectionGeneral}</h3>
        <div className="grid gap-3">
          <QuestionCard label={L[lang].qFever} value={fiebre} onChange={setFiebre} disabled={disabled} lang={lang} />
          <QuestionCard label={L[lang].qCough} value={tos} onChange={setTos} disabled={disabled} lang={lang} />
          <QuestionCard label={L[lang].qHeadache} value={dolorCabeza} onChange={setDolorCabeza} disabled={disabled} lang={lang} />
          <QuestionCard label={L[lang].qBreath} value={dificultadRespirar} onChange={setDificultadRespirar} disabled={disabled} lang={lang} />
        </div>
      </div>

      {/* Más síntomas - Expandible */}
      {showMore && (
        <div className="space-y-6 animate-fade-in">
          {/* Digestivos */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{L[lang].sectionDigestive}</h3>
            <div className="grid gap-3">
              <QuestionCard label={L[lang].qNausea} value={nausea} onChange={setNausea} disabled={disabled} lang={lang} />
              <QuestionCard label={L[lang].qAbdominal} value={dolorAbdominal} onChange={setDolorAbdominal} disabled={disabled} lang={lang} />
              <QuestionCard label={L[lang].qDiarrhea} value={diarrea} onChange={setDiarrea} disabled={disabled} lang={lang} />
            </div>
          </div>

          {/* Dolor y Músculos */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{L[lang].sectionPain}</h3>
            <div className="grid gap-3">
              <QuestionCard label={L[lang].qMuscle} value={dolorMuscular} onChange={setDolorMuscular} disabled={disabled} lang={lang} />
              <QuestionCard label={L[lang].qBack} value={dolorEspalda} onChange={setDolorEspalda} disabled={disabled} lang={lang} />
            </div>
          </div>

          {/* ORL */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{L[lang].sectionOrl}</h3>
            <div className="grid gap-3">
              <QuestionCard label={L[lang].qThroat} value={dolorGarganta} onChange={setDolorGarganta} disabled={disabled} lang={lang} />
              <QuestionCard label={L[lang].qCongestion} value={congestion} onChange={setCongestion} disabled={disabled} lang={lang} />
              <QuestionCard label={L[lang].qEar} value={dolorOido} onChange={setDolorOido} disabled={disabled} lang={lang} />
            </div>
          </div>

          {/* Otros Síntomas */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{L[lang].sectionOther}</h3>
            <div className="grid gap-3">
              <QuestionCard label={L[lang].qDizziness} value={mareo} onChange={setMareo} disabled={disabled} lang={lang} />
              <QuestionCard label={L[lang].qVision} value={problemaVision} onChange={setProblemaVision} disabled={disabled} lang={lang} />
              <QuestionCard label={L[lang].qRash} value={erupcion} onChange={setErupcion} disabled={disabled} lang={lang} />
              <QuestionCard label={L[lang].qItching} value={picazon} onChange={setPicazon} disabled={disabled} lang={lang} />
              <QuestionCard label={L[lang].qFatigue} value={fatiga} onChange={setFatiga} disabled={disabled} lang={lang} />
              <QuestionCard label={L[lang].qUrinary} value={ardorOrinar} onChange={setArdorOrinar} disabled={disabled} lang={lang} />
            </div>
          </div>
        </div>
      )}

      {/* Botón expandir/colapsar */}
      <button
        type="button"
        onClick={() => setShowMore(!showMore)}
        className="w-full py-3 text-teal-600 font-medium text-sm flex items-center justify-center gap-2 rounded-xl border border-dashed border-teal-200 hover:bg-teal-50 transition-colors"
        disabled={disabled}
      >
        {showMore ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        {showMore ? L[lang].showLess : L[lang].showMore}
      </button>

      {/* Señales de Alerta */}
      <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
        <div className="flex items-center gap-3 mb-4 text-red-800">
          <AlertTriangle size={20} />
          <div>
            <h3 className="font-bold">{L[lang].rfTitle}</h3>
            <p className="text-xs text-red-600">{L[lang].rfDesc}</p>
          </div>
        </div>
        <div className="grid gap-3">
          <QuestionCard label={L[lang].qChest} value={dolorPecho} onChange={setDolorPecho} disabled={disabled} lang={lang} isRedFlag />
          <QuestionCard label={L[lang].qConfusion} value={confusion} onChange={setConfusion} disabled={disabled} lang={lang} isRedFlag />
          <QuestionCard label={L[lang].qBlood} value={sangrado} onChange={setSangrado} disabled={disabled} lang={lang} isRedFlag />
          <QuestionCard label={L[lang].qFainting} value={desmayo} onChange={setDesmayo} disabled={disabled} lang={lang} isRedFlag />
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
