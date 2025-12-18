import React, { useCallback, useEffect, useRef, useState } from 'react'
import { SymptomForm } from './SymptomForm'
import { Results } from './Results'
import { History } from './History'
import { GuidedQuestions } from './GuidedQuestions'
import { diagnose, DiagnoseResponse } from '../api'
import { AccessibilityMenu } from './AccessibilityMenu'
import { LoginPage } from './LoginPage'
import { RegisterPage } from './RegisterPage'
import { UserSelectionPage, UserProfile } from './UserSelectionPage'
// Re-import check
import { ProfilePage } from './ProfilePage'
import { TermsPage } from './TermsPage'
import { Layout } from './Layout'
import type { Page, Lang } from './Layout'
import illDx from '../assets/illustration-dx.svg'
import { Activity, Calendar, FileText, AlertCircle, ArrowRight, Zap, Info, ChevronRight } from 'lucide-react'

export function App() {
  const [loggedIn, setLoggedIn] = useState<string | null>(null)
  const [authView, setAuthView] = useState<'login' | 'register' | 'terms' | 'user-selection'>('login')
  const [page, setPage] = useState<Page>('inicio')
  const [lang, setLangState] = useState<Lang>('es')
  const [visualAlerts, setVisualAlerts] = useState(false)
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [selectedProfileEmail, setSelectedProfileEmail] = useState<string>('')

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('app:profiles') || '[]')
      if (Array.isArray(saved) && saved.length > 0) {
        setProfiles(saved)
        setAuthView('user-selection')
      }
    } catch {}
  }, [])

  useEffect(() => {
    const handler = (e: any) => setVisualAlerts(e.detail.visualAlerts)
    window.addEventListener('a11y-prefs-changed', handler)
    try {
       const p = JSON.parse(localStorage.getItem('a11y:prefs') || '{}')
       if (p.visualAlerts) setVisualAlerts(true)
    } catch {}
    return () => window.removeEventListener('a11y-prefs-changed', handler)
  }, [])
  
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
      newsTitle: 'Novedades',
      news1: 'Nueva función de dictado por voz disponible en el formulario de síntomas.',
      news2: 'Mejoras en el modo de alto contraste para mayor legibilidad.',
      profileTitle: 'Mi Perfil',
      profileName: 'Nombre',
      profileEmail: 'Correo',
      profileRole: 'Rol',
      profileEdit: 'Editar perfil (No disponible)',
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
      newsTitle: 'News',
      news1: 'New voice dictation feature available in symptom form.',
      news2: 'High contrast mode improvements for better readability.',
      profileTitle: 'My Profile',
      profileName: 'Name',
      profileEmail: 'Email',
      profileRole: 'Role',
      profileEdit: 'Edit profile (Not available)',
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
    setAckRedFlags(false)
  }, [])

  function handleSearch(query: string) {
    const q = query.toLowerCase()
    if (q.includes('hist') || q.includes('history')) setPage('historial')
    else if (q.includes('diag') || q.includes('sintoma') || q.includes('symptom')) setPage('diagnostico')
    else if (q.includes('perf') || q.includes('prof')) setPage('perfil')
    else if (q.includes('ayuda') || q.includes('help')) setPage('ayuda')
    else if (q.includes('inicio') || q.includes('home')) setPage('inicio')
    else {
      setSessionMsg(lang === 'es' ? `No se encontraron resultados para "${query}"` : `No results found for "${query}"`)
    }
  }

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
    let remembered = selectedProfileEmail || ''
    try { if (!remembered) remembered = localStorage.getItem('saved_email') || '' } catch { /* storage not available */ }
    
    return (
      <>
        {authView === 'user-selection' && (
          <UserSelectionPage 
            profiles={profiles}
            lang={lang}
            onAdd={() => setAuthView('login')}
            onRemove={(email) => {
              const newProfiles = profiles.filter(p => p.email !== email)
              setProfiles(newProfiles)
              localStorage.setItem('app:profiles', JSON.stringify(newProfiles))
              if (newProfiles.length === 0) setAuthView('login')
            }}
            onSelect={(p) => {
              if (p.token) {
                // Auto login
                localStorage.setItem('token', p.token)
                setLoggedIn(p.email)
                setSessionMsg(`Bienvenido de nuevo, ${p.name}`)
                setPage('inicio')
              } else {
                // Require password
                setSelectedProfileEmail(p.email)
                setAuthView('login')
              }
            }}
          />
        )}
        {authView === 'login' && (
          <LoginPage 
            onSuccess={(email, name, token, remember) => { 
              setLoggedIn(email)
              setSessionMsg(`Bienvenido, ${name}`)
              setPage('inicio')
              
              // Save profile
              const newProfile: UserProfile = {
                email,
                name,
                color: profiles.find(p => p.email === email)?.color || '#' + Math.floor(Math.random()*16777215).toString(16),
                token: remember ? token : undefined
              }
              const newProfiles = [...profiles.filter(p => p.email !== email), newProfile]
              setProfiles(newProfiles)
              localStorage.setItem('app:profiles', JSON.stringify(newProfiles))
            }} 
            onRegister={() => setAuthView('register')}
            onTerms={() => setAuthView('terms')}
            defaultEmail={remembered} 
          />
        )}
        {authView === 'register' && (
          <RegisterPage 
            onSuccess={() => {
              setAuthView('login')
              setSessionMsg('Cuenta creada. Por favor inicia sesión.')
              // Refresh profiles in case register added one (though we handle it here usually)
              try {
                 const saved = JSON.parse(localStorage.getItem('app:profiles') || '[]')
                 setProfiles(saved)
              } catch {}
            }}
            onCancel={() => setAuthView('login')}
            lang={lang}
          />
        )}
        {authView === 'terms' && (
          <TermsPage onBack={() => setAuthView('login')} lang={lang} />
        )}
        <AccessibilityMenu />
      </>
    )
  }

  function renderBody() {
    if (page === 'inicio') {
      return (
        <div className="space-y-6 animate-fade-in">
          {/* HERO SECTION */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-teal-400/20 rounded-full blur-2xl" />
            
            <div className="relative p-8 md:p-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">{L[lang].homeWelcome}</h2>
              <p className="text-teal-100 text-lg max-w-2xl">
                {L[lang].homeIntro.replace('{email}', String(loggedIn))}
              </p>
              
              <div className="mt-8 flex flex-wrap gap-3">
                <button 
                  onClick={() => setPage('diagnostico')}
                  className="px-6 py-3 bg-white text-teal-700 rounded-xl font-bold shadow-lg hover:bg-teal-50 hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Activity size={20} />
                  {L[lang].goDiagnose}
                </button>
                <button 
                  onClick={() => setPage('historial')}
                  className="px-6 py-3 bg-teal-800/40 text-white border border-white/20 rounded-xl font-semibold hover:bg-teal-800/60 transition-all flex items-center gap-2"
                >
                  <Calendar size={20} />
                  {L[lang].viewHistory}
                </button>
              </div>
            </div>
          </div>

          {/* DASHBOARD GRID */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Quick Tips Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Zap size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{L[lang].quickHelp}</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {L[lang].tip1}
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {L[lang].tip2}
                </li>
              </ul>
            </div>

            {/* Important Notice Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center mb-4">
                <AlertCircle size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{L[lang].important}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {L[lang].disclaimer}
              </p>
            </div>

            {/* System Status / Artwork */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-sm text-white relative overflow-hidden group cursor-pointer" onClick={() => setPage('ayuda')}>
              <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Info size={80} />
              </div>
              <div className="relative z-10">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4 backdrop-blur-sm">
                  <Info size={20} />
                </div>
                <h3 className="text-lg font-bold mb-2">{L[lang].help}</h3>
                <p className="text-slate-400 text-sm mb-4">
                  {lang === 'en' ? 'Need assistance? Check our guides.' : '¿Necesitas ayuda? Revisa nuestras guías.'}
                </p>
                <div className="flex items-center gap-2 text-sm font-medium text-teal-400 group-hover:translate-x-1 transition-transform">
                  {lang === 'en' ? 'Go to Help' : 'Ir a Ayuda'} <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Placeholder (Visual Filler) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">
                {lang === 'en' ? 'Recent Activity' : 'Actividad Reciente'}
              </h3>
              <button className="text-sm text-teal-600 font-medium hover:underline" onClick={() => setPage('historial')}>
                {lang === 'en' ? 'View All' : 'Ver Todo'}
              </button>
            </div>
            
            <div className="space-y-4">
              {[1, 2].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">
                      {lang === 'en' ? 'Symptom Check' : 'Chequeo de Síntomas'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {lang === 'en' ? 'Completed 2 days ago' : 'Completado hace 2 días'}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
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
                <div ref={alertRef} role="alert" tabIndex={-1} className={`mt-3 rounded border border-red-300 bg-red-50 text-red-800 p-3 focus:outline-none focus:ring-2 focus:ring-red-300 ${visualAlerts ? 'animate-pulse border-4 border-red-600' : ''}`}>
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
                {error && <p role="alert" className={`text-red-700 ${visualAlerts ? 'animate-pulse border-4 border-red-500 p-4 bg-red-50 font-bold text-lg' : ''}`}>{error}</p>}
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
    if (page === 'perfil') return <ProfilePage lang={lang} />
    if (page === 'terminos') return <TermsPage onBack={() => setPage('inicio')} lang={lang} />
    if (page === 'soporte') return (
      <div className="card card-body">
        <h2 className="text-xl font-semibold mb-4">{lang === 'en' ? 'Support & Contact' : 'Soporte y Contacto'}</h2>
        <p>{lang === 'en' ? 'For assistance, please contact us at:' : 'Para asistencia, contáctanos en:'}</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Email: support@saludasist.com</li>
          <li>Tel: +1 234 567 890</li>
        </ul>
        <button onClick={() => setPage('inicio')} className="btn btn-secondary mt-4">
          {lang === 'en' ? 'Back' : 'Volver'}
        </button>
      </div>
    )
    
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
      <Layout 
        current={page} 
        onNavigate={setPage} 
        onLogout={() => { 
          setLoggedIn(null)
          setPage('inicio')
          // Check if we should go to user selection
          try {
            const saved = JSON.parse(localStorage.getItem('app:profiles') || '[]')
            if (Array.isArray(saved) && saved.length > 0) {
              setProfiles(saved)
              setAuthView('user-selection')
            } else {
              setAuthView('login')
            }
          } catch {
            setAuthView('login')
          }
        }} 
        lang={lang} 
        setLang={(l) => { setLangState(l); try { localStorage.setItem('lang', l) } catch { /* storage not available */ } }} 
        onSearch={handleSearch}
        status={sessionMsg}
      >
        {renderBody()}
      </Layout>
      <AccessibilityMenu />
    </>
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
