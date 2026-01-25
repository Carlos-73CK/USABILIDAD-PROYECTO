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
        <div className="space-y-8 animate-fade-in">
          {/* HERO SECTION - Mejorado */}
          <div className="hero-gradient rounded-3xl text-white shadow-2xl overflow-hidden">
            <div className="relative p-8 md:p-12">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  {lang === 'es' ? 'Sistema activo y listo' : 'System active and ready'}
                </div>
                
                <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
                  {L[lang].homeWelcome}, <span className="text-emerald-300">{String(loggedIn).split('@')[0]}</span>
                </h2>
                <p className="text-teal-100 text-lg md:text-xl max-w-2xl leading-relaxed">
                  {lang === 'es' 
                    ? 'Analiza tus síntomas con inteligencia artificial y obtén orientación médica preliminar en segundos.'
                    : 'Analyze your symptoms with AI and get preliminary medical guidance in seconds.'
                  }
                </p>
                
                <div className="mt-10 flex flex-wrap gap-4">
                  <button 
                    onClick={() => setPage('diagnostico')}
                    className="group px-8 py-4 bg-white text-teal-700 rounded-2xl font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                      <Activity size={22} />
                    </div>
                    <div className="text-left">
                      <div className="text-lg">{L[lang].goDiagnose}</div>
                      <div className="text-sm text-teal-600 font-normal">{lang === 'es' ? 'Iniciar análisis' : 'Start analysis'}</div>
                    </div>
                    <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => setPage('historial')}
                    className="px-6 py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-semibold hover:bg-white/20 transition-all flex items-center gap-3 backdrop-blur-sm"
                  >
                    <Calendar size={22} />
                    {L[lang].viewHistory}
                  </button>
                </div>
              </div>
              
              {/* Stats row */}
              <div className="relative z-10 mt-12 pt-8 border-t border-white/10 grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white">97+</div>
                  <div className="text-teal-200 text-sm mt-1">{lang === 'es' ? 'Diagnósticos' : 'Diagnoses'}</div>
                </div>
                <div className="text-center border-x border-white/10">
                  <div className="text-3xl md:text-4xl font-bold text-white">228</div>
                  <div className="text-teal-200 text-sm mt-1">{lang === 'es' ? 'Síntomas' : 'Symptoms'}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white">24/7</div>
                  <div className="text-teal-200 text-sm mt-1">{lang === 'es' ? 'Disponible' : 'Available'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS GRID */}
          <div className="grid md:grid-cols-4 gap-4">
            <button 
              onClick={() => setPage('diagnostico')} 
              className="feature-card group text-left"
            >
              <div className="feature-icon feature-icon-teal">
                <Activity size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{lang === 'es' ? 'Nuevo Diagnóstico' : 'New Diagnosis'}</h3>
              <p className="text-sm text-slate-500">{lang === 'es' ? 'Inicia un análisis de síntomas' : 'Start a symptom analysis'}</p>
              <div className="mt-4 flex items-center gap-1 text-teal-600 text-sm font-medium group-hover:gap-2 transition-all">
                {lang === 'es' ? 'Comenzar' : 'Start'} <ChevronRight size={16} />
              </div>
            </button>
            
            <button 
              onClick={() => setPage('historial')} 
              className="feature-card group text-left"
            >
              <div className="feature-icon feature-icon-blue">
                <FileText size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{lang === 'es' ? 'Historial' : 'History'}</h3>
              <p className="text-sm text-slate-500">{lang === 'es' ? 'Revisa diagnósticos anteriores' : 'Review past diagnoses'}</p>
              <div className="mt-4 flex items-center gap-1 text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
                {lang === 'es' ? 'Ver todo' : 'View all'} <ChevronRight size={16} />
              </div>
            </button>
            
            <button 
              onClick={() => setPage('perfil')} 
              className="feature-card group text-left"
            >
              <div className="feature-icon feature-icon-purple">
                <Info size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{lang === 'es' ? 'Mi Perfil' : 'My Profile'}</h3>
              <p className="text-sm text-slate-500">{lang === 'es' ? 'Gestiona tu información' : 'Manage your information'}</p>
              <div className="mt-4 flex items-center gap-1 text-purple-600 text-sm font-medium group-hover:gap-2 transition-all">
                {lang === 'es' ? 'Editar' : 'Edit'} <ChevronRight size={16} />
              </div>
            </button>
            
            <button 
              onClick={() => setPage('ayuda')} 
              className="feature-card group text-left"
            >
              <div className="feature-icon feature-icon-amber">
                <Zap size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{lang === 'es' ? 'Ayuda' : 'Help'}</h3>
              <p className="text-sm text-slate-500">{lang === 'es' ? 'Guías y tutoriales' : 'Guides and tutorials'}</p>
              <div className="mt-4 flex items-center gap-1 text-amber-600 text-sm font-medium group-hover:gap-2 transition-all">
                {lang === 'es' ? 'Explorar' : 'Explore'} <ChevronRight size={16} />
              </div>
            </button>
          </div>

          {/* INFO CARDS ROW */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Tips Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all hover:border-teal-200">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-emerald-100 text-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Zap size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{L[lang].quickHelp}</h3>
                  <ul className="space-y-3 text-slate-600">
                    <li className="flex items-start gap-3">
                      <span className="mt-2 w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                      <span>{L[lang].tip1}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-2 w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                      <span>{L[lang].tip2}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-2 w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                      <span>{L[lang].tip3}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Important Notice Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-2xl shadow-sm border border-amber-200 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-200 to-orange-200 text-amber-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-900 mb-3">{L[lang].important}</h3>
                  <p className="text-amber-800 leading-relaxed">
                    {L[lang].disclaimer}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                  <FileText size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {lang === 'en' ? 'Recent Activity' : 'Actividad Reciente'}
                </h3>
              </div>
              <button className="text-sm text-teal-600 font-semibold hover:text-teal-700 flex items-center gap-1 transition-colors" onClick={() => setPage('historial')}>
                {lang === 'en' ? 'View All' : 'Ver Todo'} <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-1">
                {[
                  { icon: '🩺', title: lang === 'es' ? 'Análisis de Síntomas' : 'Symptom Analysis', time: lang === 'es' ? 'Hace 2 días' : '2 days ago', status: 'success' },
                  { icon: '📋', title: lang === 'es' ? 'Perfil Actualizado' : 'Profile Updated', time: lang === 'es' ? 'Hace 1 semana' : '1 week ago', status: 'info' },
                  { icon: '✅', title: lang === 'es' ? 'Cuenta Creada' : 'Account Created', time: lang === 'es' ? 'Hace 2 semanas' : '2 weeks ago', status: 'success' },
                ].map((item, i) => (
                  <div key={i} className="activity-item stagger-item">
                    <div className={`activity-dot ${item.status === 'success' ? 'activity-dot-teal' : 'activity-dot-blue'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium text-slate-700">{item.title}</span>
                      </div>
                      <span className="text-sm text-slate-400">{item.time}</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }
    if (page === 'diagnostico') {
      return (
        <section className="space-y-6 animate-fade-in" aria-labelledby="form-title">
          {/* Header de diagnóstico */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Activity size={28} />
              </div>
              <div>
                <h2 id="form-title" className="text-2xl font-bold">{L[lang].enterSymptoms}</h2>
                <p className="text-teal-100">{lang === 'es' ? 'Completa los pasos para obtener tu análisis' : 'Complete the steps to get your analysis'}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Panel principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Paso 1: Preguntas guiadas */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-white p-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                      <h3 className="font-bold text-slate-800">{L[lang].step1}</h3>
                      <p className="text-sm text-slate-500">{lang === 'es' ? 'Responde las preguntas sobre tus síntomas' : 'Answer questions about your symptoms'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <GuidedQuestions onChange={onGuidedChange} disabled={loading} lang={lang} />
                </div>
              </div>

              {/* Síntomas seleccionados de guía */}
              {guidedSymptoms.length > 0 && (
                <div className="info-banner animate-scale-in">
                  <div className="info-banner-icon">
                    <Activity size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-teal-800 mb-2">{L[lang].selectedFromGuide}: ({guidedSymptoms.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {guidedSymptoms.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-sm font-medium text-teal-700 border border-teal-200 shadow-sm">
                          <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Alerta de banderas rojas */}
              {redFlags.length > 0 && (
                <div ref={alertRef} role="alert" tabIndex={-1} className={`bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border-2 border-red-200 p-6 focus:outline-none focus:ring-2 focus:ring-red-300 ${visualAlerts ? 'animate-pulse border-4 border-red-600' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <AlertCircle size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-red-800 text-lg mb-2">{L[lang].redFlagsTitle}</p>
                      <ul className="space-y-1 mb-4">
                        {redFlags.map((r) => (
                          <li key={r} className="flex items-center gap-2 text-red-700">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                            {r}
                          </li>
                        ))}
                      </ul>
                      <p className="text-red-700 mb-4">{L[lang].redFlagsAdvice}</p>
                      <label className="inline-flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-red-200 cursor-pointer hover:bg-red-50 transition-colors">
                        <input type="checkbox" checked={ackRedFlags} onChange={(e) => setAckRedFlags(e.target.checked)} className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500" />
                        <span className="font-medium text-red-800">{L[lang].redFlagsAck}</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 2: Síntomas manuales */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-white p-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                      <h3 className="font-bold text-slate-800">{L[lang].step2}</h3>
                      <p className="text-sm text-slate-500">{lang === 'es' ? 'Escribe o dicta síntomas adicionales' : 'Type or dictate additional symptoms'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <SymptomForm onSubmit={onSubmit} disabled={loading || (redFlags.length > 0 && !ackRedFlags)} lang={lang} guidedSymptoms={guidedSymptoms} />
                </div>
              </div>

              {/* Estado de carga y resultados */}
              <div aria-live="polite" aria-atomic="true">
                {loading && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                    <p className="text-lg font-medium text-slate-700">{L[lang].processing}</p>
                    <p className="text-sm text-slate-500 mt-1">{lang === 'es' ? 'Analizando tus síntomas...' : 'Analyzing your symptoms...'}</p>
                  </div>
                )}
                {error && (
                  <div role="alert" className={`bg-red-50 rounded-2xl border border-red-200 p-6 ${visualAlerts ? 'animate-pulse border-4 border-red-500' : ''}`}>
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-red-500" size={24} />
                      <p className="text-red-700 font-medium">{error}</p>
                    </div>
                  </div>
                )}
                {data && <Results data={data} lang={lang} />}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-4">
              <DxSidebar lang={lang} />
            </aside>
          </div>
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
      {/* Imagen decorativa */}
      <div className="dx-sidebar-card overflow-hidden">
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-6">
          <img src={illDx} alt="" aria-hidden className="w-full rounded-xl shadow-sm" />
        </div>
      </div>
      
      {/* Tips mejorado */}
      <div className="dx-sidebar-card">
        <div className="dx-sidebar-header">
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <h3 className="font-bold text-teal-800">{lang==='en' ? 'Tips' : 'Consejos'}</h3>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-teal-600 text-xs font-bold">1</span>
            </div>
            <p className="text-sm text-slate-600">{lang==='en' ? 'Describe symptoms in simple words.' : 'Describe los síntomas con palabras simples.'}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-teal-600 text-xs font-bold">2</span>
            </div>
            <p className="text-sm text-slate-600">{lang==='en' ? 'Include duration and intensity if possible.' : 'Incluye duración e intensidad si es posible.'}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-teal-600 text-xs font-bold">3</span>
            </div>
            <p className="text-sm text-slate-600">{lang==='en' ? 'Use the guided questions first.' : 'Empieza por las preguntas guiadas.'}</p>
          </div>
        </div>
      </div>
      
      {/* Importante */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-bold text-amber-800 mb-1">{lang==='en' ? 'Important' : 'Importante'}</h3>
            <p className="text-sm text-amber-700">{lang==='en' ? 'Preliminary assessment only. Not a diagnosis.' : 'Evaluación preliminar. No es un diagnóstico.'}</p>
          </div>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Activity size={18} />
          {lang === 'es' ? 'Base de datos' : 'Database'}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white/10 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400">97</div>
            <div className="text-xs text-slate-400 mt-1">{lang === 'es' ? 'Diagnósticos' : 'Diagnoses'}</div>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400">228</div>
            <div className="text-xs text-slate-400 mt-1">{lang === 'es' ? 'Síntomas' : 'Symptoms'}</div>
          </div>
        </div>
      </div>
    </>
  )
}
