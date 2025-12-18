import React, { useEffect, useRef, useState } from 'react'
import logoUrl from '../assets/logo.svg'
import { 
  Home, 
  Stethoscope, 
  Clock, 
  HelpCircle, 
  User, 
  LogOut, 
  Menu, 
  Search, 
  Globe,
  ChevronLeft,
  ChevronRight,
  Bell,
  Settings
} from 'lucide-react'

type Page = 'inicio' | 'diagnostico' | 'historial' | 'ayuda' | 'perfil' | 'terminos' | 'soporte'
type Lang = 'es' | 'en'

type Props = Readonly<{
  current: Page
  onNavigate: (p: Page) => void
  onLogout: () => void
  lang: Lang
  setLang: (l: Lang) => void
  onSearch?: (q: string) => void
  children: React.ReactNode
  status?: string | null
}>

const labels: Record<Lang, Record<string, string>> = {
  es: {
    system: 'SaludAsist',
    search: 'Buscar...',
    language: 'Idioma',
    where: 'Estás en',
    menu: 'Menú Principal',
    home: 'Inicio',
    diagnose: 'Diagnóstico',
    history: 'Historial',
    help: 'Ayuda',
    profile: 'Mi Perfil',
    logout: 'Cerrar Sesión',
    welcome: 'Bienvenido/a',
    footerInst: '© 2025 Institución Médica. Todos los derechos reservados.',
    footerSupport: 'Soporte',
    footerTerms: 'Legal',
    notifications: 'Notificaciones',
    settings: 'Configuración'
  },
  en: {
    system: 'HealthAssist',
    search: 'Search patient, history...',
    language: 'Language',
    where: 'You are at',
    menu: 'Main Menu',
    home: 'Home',
    diagnose: 'Diagnosis',
    history: 'History',
    help: 'Help',
    profile: 'My Profile',
    logout: 'Logout',
    welcome: 'Welcome',
    footerInst: '© 2025 Medical Institution. All rights reserved.',
    footerSupport: 'Support',
    footerTerms: 'Legal',
    notifications: 'Notifications',
    settings: 'Settings'
  },
}

export function Layout({ current, onNavigate, onLogout, lang, setLang, onSearch, children, status }: Props) {
  const L = labels[lang]
  const [q, setQ] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const statusRef = useRef<HTMLDivElement | null>(null)

  // Get user profile from localStorage if available
  const [userProfile, setUserProfile] = useState<{name: string, avatar: string} | null>(null)

  useEffect(() => {
    const savedProfile = localStorage.getItem('app:current_profile')
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile))
      } catch (e) {
        console.error("Error parsing profile", e)
      }
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey && !e.shiftKey && !e.ctrlKey) {
        if (e.key === '1') onNavigate('inicio')
        if (e.key === '2') onNavigate('diagnostico')
        if (e.key === '3') onNavigate('historial')
        if (e.key === '4') onNavigate('ayuda')
        if (e.key === '0') onLogout()
      }
    }
    globalThis.addEventListener('keydown', onKey)
    return () => globalThis.removeEventListener('keydown', onKey)
  }, [onNavigate, onLogout])

  useEffect(() => {
    if (status && statusRef.current) statusRef.current.focus()
  }, [status])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    onSearch?.(q)
  }

  const NavItem = ({ page, icon: Icon, label }: { page: Page, icon: any, label: string }) => {
    const active = current === page
    return (
      <li>
        <button 
          onClick={() => onNavigate(page)}
          aria-current={active ? 'page' : undefined}
          className={`
            w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden
            ${active 
              ? 'bg-teal-50 text-teal-700 font-semibold shadow-sm ring-1 ring-teal-100' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }
          `}
          title={collapsed ? label : undefined}
        >
          {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-500 rounded-r-full" />
          )}
          <Icon size={22} className={`transition-colors ${active ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
          {!collapsed && <span className="tracking-wide">{label}</span>}
          
          {active && !collapsed && (
            <ChevronRight size={16} className="ml-auto text-teal-400" />
          )}
        </button>
      </li>
    )
  }

  return (
    <div className="min-h-screen flex bg-slate-50/50 font-sans text-slate-600">
      {/* SIDEBAR */}
      <aside 
        className={`
          bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-out z-40 shadow-xl lg:shadow-none
          fixed lg:static h-full
          ${collapsed ? 'w-20' : 'w-72'}
        `}
      >
        {/* LOGO AREA */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden w-full">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0 text-white font-bold shadow-lg shadow-teal-200">
              <Stethoscope size={22} />
            </div>
            {!collapsed && (
              <div className="flex flex-col animate-fade-in">
                <span className="font-bold text-xl text-slate-800 tracking-tight whitespace-nowrap leading-none">
                  {L.system}
                </span>
                <span className="text-xs text-slate-400 font-medium mt-1">Medical Dashboard</span>
              </div>
            )}
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200" aria-label={L.menu}>
          <ul className="space-y-1.5">
            <NavItem page="inicio" icon={Home} label={L.home} />
            <NavItem page="diagnostico" icon={Stethoscope} label={L.diagnose} />
            <NavItem page="historial" icon={Clock} label={L.history} />
            <div className="my-4 border-t border-slate-100 mx-2" />
            <NavItem page="perfil" icon={User} label={L.profile} />
            <NavItem page="ayuda" icon={HelpCircle} label={L.help} />
          </ul>
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-white hover:shadow-sm hover:text-slate-600 transition-all mb-3 border border-transparent hover:border-slate-200"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          
          <button 
            onClick={onLogout}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-white hover:text-red-600 hover:shadow-md hover:shadow-red-100 transition-all duration-200 border border-transparent hover:border-red-100 group
              ${collapsed ? 'justify-center px-2' : ''}
            `}
            title={L.logout}
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            {!collapsed && <span className="font-medium">{L.logout}</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 ${collapsed ? 'lg:ml-0' : ''}`}>
        
        {/* HEADER */}
        <header className="h-20 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 transition-all">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setCollapsed(!collapsed)}
            >
              <Menu size={24} />
            </button>
            
            {/* SEARCH BAR */}
            <form onSubmit={submitSearch} className="max-w-md w-full hidden md:block group">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={20} />
                <input 
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-100/50 border-none rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:shadow-lg transition-all duration-300 outline-none placeholder:text-slate-400"
                  value={q} 
                  onChange={(e) => setQ(e.target.value)} 
                  placeholder={L.search}
                  aria-label={L.search} 
                />
              </div>
            </form>
          </div>

          {/* HEADER ACTIONS */}
          <div className="flex items-center gap-3 md:gap-6">
            {/* Language Selector */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm hover:border-teal-200 transition-colors">
              <Globe size={14} className="text-slate-400" />
              <select 
                className="bg-transparent text-xs text-slate-600 font-semibold outline-none cursor-pointer uppercase tracking-wide"
                value={lang} 
                onChange={(e) => setLang((e.target.value === 'en' ? 'en' : 'es'))} 
                aria-label={L.language}
              >
                <option value="es">ES</option>
                <option value="en">EN</option>
              </select>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            {/* Notifications (Visual only) */}
            <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onNavigate('perfil')}>
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-700 leading-none">{userProfile?.name || 'Usuario'}</p>
                <p className="text-xs text-slate-400 mt-1">Paciente</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 text-teal-700 flex items-center justify-center font-bold text-sm border-2 border-white shadow-md ring-1 ring-slate-100 overflow-hidden">
                {userProfile?.avatar ? (
                  <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={18} />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        <main id="main-scroll-container" className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* BREADCRUMB / STATUS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 capitalize tracking-tight">{current}</h1>
                <nav className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <span>{L.system}</span>
                  <ChevronRight size={14} />
                  <span className="font-medium text-teal-600 capitalize">{current}</span>
                </nav>
              </div>
            </div>

            {status && (
              <div ref={statusRef} tabIndex={-1} className="p-4 rounded-xl border border-green-200 bg-green-50/80 backdrop-blur-sm text-green-800 flex items-center gap-3 shadow-sm animate-fade-in" aria-live="polite">
                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                {status}
              </div>
            )}

            <div className="animate-fade-in min-h-[60vh]">
              {children}
            </div>
          </div>

          {/* FOOTER INSIDE SCROLL AREA */}
          <footer className="mt-16 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm pb-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6">
              <button type="button" className="hover:text-teal-600 transition-colors font-medium" onClick={() => onNavigate('soporte')}>{L.footerSupport}</button>
              <div className="w-1 h-1 rounded-full bg-slate-300 hidden md:block" />
              <button type="button" className="hover:text-teal-600 transition-colors font-medium" onClick={() => onNavigate('terminos')}>{L.footerTerms}</button>
            </div>
            <p className="opacity-70">{L.footerInst}</p>
          </footer>
        </main>
      </div>
    </div>
  )
}

export type { Page, Lang }
