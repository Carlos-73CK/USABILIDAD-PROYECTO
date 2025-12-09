import React, { useCallback, useEffect, useRef, useState } from 'react'
import { SymptomForm } from './SymptomForm'
import { Results } from './Results'
import { History } from './History'
import { GuidedQuestions } from './GuidedQuestions'
import { diagnose, DiagnoseResponse } from '../api'
import { A11yBar } from './A11yBar'
import { AccessibilityMenu } from './AccessibilityMenu'
import { LoginPage } from './LoginPage'
import { Layout } from './Layout'
import type { Page, Lang } from './Layout'
import illDx from '../assets/illustration-dx.svg'

export function App() {
  const [loggedIn, setLoggedIn] = useState<string | null>(null)
  const [page, setPage] = useState<Page>('inicio')
  const [lang, setLangState] = useState<Lang>('es')
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lang')
      setLangState(stored === 'en' ? 'en' : 'es')
    } catch { /* ignore */ }
  }, [])
  const [sessionMsg, setSessionMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DiagnoseResponse | null>(null)
  const [guidedSymptoms, setGuidedSymptoms] = useState<string[]>([])
  const [redFlags, setRedFlags] = useState<string[]>([])
  const [ackRedFlags, setAckRedFlags] = useState(false)
  const alertRef = useRef<HTMLDivElement | null>(null)
  const L = {
    es: {
      homeWelcome: 'Bienvenido/a',
      homeIntro: 'Hola, {email}. Usa los accesos rápidos o el menú para continuar.',
      goDiagnose: 'Ir a Diagnóstico',
      viewHistory: 'Ver Historial',
      help: 'Ayuda',
      quickHelp: 'Ayuda rápida',
  important: 'Aviso importante',
  disclaimer: 'Este sistema ofrece un diagnóstico preliminar con fines orientativos. No sustituye la evaluación ni el tratamiento por profesionales de la salud.',
      tip1: 'Usa Alt+1..4 para navegar rápido.',
      tip2: 'Abre el menú ♿ para opciones de accesibilidad.',
      tip3: 'El foco siempre es visible; navega con Tab/Shift+Tab.',
      enterSymptoms: 'Ingresar síntomas',
  step1: 'Paso 1: responde preguntas guiadas',
  step2: 'Paso 2: añade síntomas manualmente',
      redFlagsTitle: 'Señales de alerta detectadas:',
      redFlagsAdvice: 'Si experimentas estos síntomas, busca atención médica inmediata.',
      redFlagsAck: 'Entiendo la recomendación y deseo continuar de todos modos.',
      processing: 'Procesando…',
      pageHelpTitle: 'Ayuda',
      pageHelpText: 'Usa el menú lateral o los atajos Alt+1..4 para navegar. Para accesibilidad, abre el menú ♿.',
      howTitle: 'Cómo funciona',
      how1Title: 'Paso 1: preguntas guiadas',
      how1Text: 'Responde Sí/No para síntomas frecuentes y señales de alarma.',
      how2Title: 'Paso 2: añade síntomas',
      how2Text: 'Escribe otros síntomas con tus propias palabras.',
      how3Title: 'Paso 3: revisa resultados',
      how3Text: 'Lee las recomendaciones y busca atención si hay señales de alerta.',
      selectedFromGuide: 'Seleccionados en preguntas guiadas',
    },
    en: {
      homeWelcome: 'Welcome',
      homeIntro: 'Hi, {email}. Use quick actions or the menu to continue.',
      goDiagnose: 'Go to Diagnosis',
      viewHistory: 'View History',
      help: 'Help',
      quickHelp: 'Quick help',
  important: 'Important notice',
  disclaimer: 'This system provides a preliminary assessment for guidance only. It does not replace professional medical evaluation or treatment.',
      tip1: 'Use Alt+1..4 for quick navigation.',
      tip2: 'Open the ♿ menu for accessibility options.',
      tip3: 'Focus is always visible; use Tab/Shift+Tab.',
      enterSymptoms: 'Enter symptoms',
  step1: 'Step 1: answer guided questions',
  step2: 'Step 2: add symptoms manually',
      redFlagsTitle: 'Red flags detected:',
      redFlagsAdvice: 'If you experience these symptoms, seek immediate medical attention.',
      redFlagsAck: 'I understand the recommendation and want to continue anyway.',
      processing: 'Processing…',
      pageHelpTitle: 'Help',
      pageHelpText: 'Use the side menu or Alt+1..4 shortcuts to navigate. For accessibility, open the ♿ menu.',
      howTitle: 'How it works',
      how1Title: 'Step 1: guided questions',
      how1Text: 'Answer Yes/No for common symptoms and red flags.',
      how2Title: 'Step 2: add symptoms',
      how2Text: 'Type additional symptoms in your own words.',
      how3Title: 'Step 3: review results',
      how3Text: 'Read recommendations and seek care if there are red flags.',
      selectedFromGuide: 'Selected from guided questions',
    },
  } as const

  useEffect(() => {
    if (redFlags.length > 0 && alertRef.current) {
      alertRef.current.focus()
    }
  }, [redFlags.length])

  const onGuidedChange = useCallback((symptoms: string[], red: string[]) => {
    setGuidedSymptoms(symptoms)
    setRedFlags(red)
    // Reiniciar confirmación si cambian las señales
    setAckRedFlags(false)
  }, [])

  async function onSubmit(symptoms: string[]) {
    setError(null)
    setLoading(true)
    try {
      const combined = Array.from(new Set([...guidedSymptoms, ...symptoms]))
      const res = await diagnose(combined)
      setData(res)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  if (!loggedIn) {
    let remembered = ''
    try { remembered = localStorage.getItem('rememberedEmail') || '' } catch { /* storage not available */ }
    return (
      <>
        <LoginPage onSuccess={(email) => { setLoggedIn(email); setSessionMsg('Sesión iniciada correctamente.'); }} defaultEmail={remembered} />
        <AccessibilityMenu />
      </>
    )
  }

  function renderBody() {
    if (page === 'inicio') {
      return (
        <section className="grid gap-4" aria-labelledby="bienvenida">
          <div className="card">
            <div className="card-body">
              <h2 id="bienvenida" className="text-xl font-semibold mb-1">{L[lang].homeWelcome}</h2>
              <p className="muted">{L[lang].homeIntro.replace('{email}', String(loggedIn))}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn btn-primary" onClick={() => setPage('diagnostico')}>🧪 {L[lang].goDiagnose}</button>
                <button className="btn" onClick={() => setPage('historial')}>🕘 {L[lang].viewHistory}</button>
                <button className="btn" onClick={() => setPage('ayuda')}>❓ {L[lang].help}</button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="card">
              <div className="card-header"><strong>{L[lang].quickHelp}</strong></div>
              <div className="card-body text-sm">
                <ul className="list-disc pl-5 space-y-1">
                  <li>{L[lang].tip1}</li>
                  <li>{L[lang].tip2}</li>
                  <li>{L[lang].tip3}</li>
                </ul>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><strong>{L[lang].important}</strong></div>
              <div className="card-body text-sm">
                <p className="muted">{L[lang].disclaimer}</p>
              </div>
            </div>
            <HomeArtwork />
          </div>
        </section>
      )
    }
    if (page === 'diagnostico') {
      return (
        <section className="grid gap-6 md:grid-cols-3" aria-labelledby="form-title">
          <div className="card md:col-span-2">
            <div className="card-body">
              <h2 id="form-title" className="text-xl font-semibold">{L[lang].enterSymptoms}</h2>
              <p className="muted text-sm">{L[lang].step1}</p>
              <div className="mt-3">
                <GuidedQuestions onChange={onGuidedChange} disabled={loading} lang={lang} />
              </div>
              {guidedSymptoms.length > 0 && (
                <div className="mt-2 text-sm">
                  <p className="font-medium mb-1">{L[lang].selectedFromGuide}:</p>
                  <div className="flex flex-wrap gap-2">
                    {guidedSymptoms.map((s) => (
                      <span key={s} className="chip" aria-label={s}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {redFlags.length > 0 && (
                <div ref={alertRef} role="alert" tabIndex={-1} className="mt-3 rounded border border-red-300 bg-red-50 text-red-800 p-3 focus:outline-none focus:ring-2 focus:ring-red-300">
                  <p className="font-medium">{L[lang].redFlagsTitle}</p>
                  <ul className="list-disc pl-6">{redFlags.map((r) => (<li key={r}>{r}</li>))}</ul>
                  <p className="mt-1">{L[lang].redFlagsAdvice}</p>
                  <div className="mt-3">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={ackRedFlags} onChange={(e) => setAckRedFlags(e.target.checked)} className="h-4 w-4" />
                      <span>{L[lang].redFlagsAck}</span>
                    </label>
                  </div>
                </div>
              )}
              <p className="muted text-sm mt-4">{L[lang].step2}</p>
              <div className="mt-2">
                <SymptomForm onSubmit={onSubmit} disabled={loading || (redFlags.length > 0 && !ackRedFlags)} lang={lang} />
              </div>
              <div className="mt-3" aria-live="polite" aria-atomic="true">
                {loading && <p>{L[lang].processing}</p>}
                {error && <p role="alert" className="text-red-700">{error}</p>}
                {data && <Results data={data} lang={lang} />}
              </div>
            </div>
          </div>
          <aside className="grid gap-4">
            <DxSidebar lang={lang} />
          </aside>
        </section>
      )
    }
    if (page === 'historial') return (<div className="card card-body"><History lang={lang} /></div>)
    return (
      <section className="grid gap-3" aria-labelledby="ayuda-title">
        <h2 id="ayuda-title" className="text-xl font-semibold">{L[lang].pageHelpTitle}</h2>
        <div className="card card-body">
          <p>{L[lang].pageHelpText}</p>
        </div>
        <section className="grid gap-3" aria-labelledby="como-title">
          <h3 id="como-title" className="text-lg font-semibold">{L[lang].howTitle}</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <article className="card">
              <div className="card-body">
                <div className="text-2xl" aria-hidden>🧭</div>
                <h4 className="font-semibold mt-1">{L[lang].how1Title}</h4>
                <p className="text-sm muted">{L[lang].how1Text}</p>
              </div>
            </article>
            <article className="card">
              <div className="card-body">
                <div className="text-2xl" aria-hidden>📝</div>
                <h4 className="font-semibold mt-1">{L[lang].how2Title}</h4>
                <p className="text-sm muted">{L[lang].how2Text}</p>
              </div>
            </article>
            <article className="card">
              <div className="card-body">
                <div className="text-2xl" aria-hidden>📊</div>
                <h4 className="font-semibold mt-1">{L[lang].how3Title}</h4>
                <p className="text-sm muted">{L[lang].how3Text}</p>
              </div>
            </article>
          </div>
        </section>
      </section>
    )
  }

  return (
    <>
  <Layout current={page} onNavigate={setPage} onLogout={() => { setLoggedIn(null); setPage('inicio') }} lang={lang} setLang={(l) => { setLangState(l); try { localStorage.setItem('lang', l) } catch { /* storage not available */ } }} status={sessionMsg}>
        <A11yBar />
        {renderBody()}
      </Layout>
      <AccessibilityMenu />
    </>
  )
}

function HomeArtwork() {
  return (
    <div className="card">
      <div className="card-body">
        <div className="h-32 w-full rounded bg-gradient-to-r from-teal-700 to-teal-500 opacity-90" aria-hidden />
        <p className="text-xs muted mt-2">Brand artwork</p>
      </div>
    </div>
  )
}

function DxSidebar({ lang }: { lang: Lang }) {
  return (
    <>
      <div className="card">
        <div className="card-body">
          <img src={illDx} alt="" aria-hidden className="w-full rounded" />
        </div>
      </div>
      <div className="card">
        <div className="card-body text-sm">
          <h3 className="font-semibold mb-1">{lang==='en' ? 'Tips' : 'Consejos'}</h3>
          <ul className="list-disc pl-5 space-y-1 muted">
            <li>{lang==='en' ? 'Describe symptoms in simple words.' : 'Describe los síntomas con palabras simples.'}</li>
            <li>{lang==='en' ? 'Include duration and intensity if possible.' : 'Incluye duración e intensidad si es posible.'}</li>
            <li>{lang==='en' ? 'Use the guided questions first.' : 'Empieza por las preguntas guiadas.'}</li>
          </ul>
        </div>
      </div>
      <div className="card">
        <div className="card-body text-sm">
          <h3 className="font-semibold mb-1">{lang==='en' ? 'Important' : 'Importante'}</h3>
          <p className="muted">{lang==='en' ? 'Preliminary assessment only. Not a diagnosis.' : 'Evaluación preliminar. No es un diagnóstico.'}</p>
        </div>
      </div>
    </>
  )
}
