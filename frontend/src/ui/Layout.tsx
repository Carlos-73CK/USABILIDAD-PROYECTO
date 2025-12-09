import React, { useEffect, useRef, useState } from 'react'
import logoUrl from '../assets/logo.svg'

type Page = 'inicio' | 'diagnostico' | 'historial' | 'ayuda'
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
    system: 'Diagnóstico preliminar',
    search: 'Buscar',
    language: 'Idioma',
    where: 'Estás en',
    menu: 'Menú',
    home: 'Inicio',
    diagnose: 'Diagnóstico',
    history: 'Historial',
    help: 'Ayuda',
    logout: 'Salir',
    welcome: 'Bienvenido/a',
  },
  en: {
    system: 'Preliminary Diagnosis',
    search: 'Search',
    language: 'Language',
    where: 'You are at',
    menu: 'Menu',
    home: 'Home',
    diagnose: 'Diagnose',
    history: 'History',
    help: 'Help',
    logout: 'Logout',
    welcome: 'Welcome',
  },
}

export function Layout({ current, onNavigate, onLogout, lang, setLang, onSearch, children, status }: Props) {
  const L = labels[lang]
  const [q, setQ] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const statusRef = useRef<HTMLDivElement | null>(null)

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

  const itemClass = (active: boolean) => `flex items-center gap-2 w-full text-left px-3 py-2 rounded ${active ? 'bg-blue-100' : 'hover:bg-gray-100'}`

  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: collapsed ? '3.5rem 1fr' : '15rem 1fr', gridTemplateRows: 'auto 1fr auto' }}>
      {/* CABECERA */}
      <header className="app-gradient col-span-2">
        <div className="max-w-6xl mx-auto p-3 flex items-center gap-3">
          <button aria-label={L.menu} className="btn" onClick={() => setCollapsed((v) => !v)}>☰</button>
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="" aria-hidden className="w-7 h-7 rounded" />
            <strong className="text-xl">{L.system}</strong>
          </div>
          <form onSubmit={submitSearch} className="ml-4 flex items-center gap-2 flex-1 max-w-xl">
            <input className="input flex-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${L.search}…`} aria-label={L.search} />
            <button className="btn" type="submit">🔎 {L.search}</button>
          </form>
          <label className="ml-auto flex items-center gap-2">
            <span className="text-sm">{L.language}</span>
            <select className="input py-1" value={lang} onChange={(e) => setLang((e.target.value === 'en' ? 'en' : 'es'))} aria-label={L.language}>
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
      </header>

      {/* MENÚ LATERAL */}
      <aside className="sidebar overflow-y-auto">
        <nav aria-label={L.menu} className="p-2">
          <ul className="space-y-1">
            <li><button className={`${itemClass(current==='inicio')} ${current==='inicio' ? 'active' : 'hoverable'}`} onClick={() => onNavigate('inicio')} aria-current={current==='inicio' ? 'page' : undefined}><span aria-hidden>🏠</span><span className={collapsed ? 'sr-only' : ''}>{L.home}</span></button></li>
            <li><button className={`${itemClass(current==='diagnostico')} ${current==='diagnostico' ? 'active' : 'hoverable'}`} onClick={() => onNavigate('diagnostico')} aria-current={current==='diagnostico' ? 'page' : undefined}><span aria-hidden>🧪</span><span className={collapsed ? 'sr-only' : ''}>{L.diagnose}</span></button></li>
            <li><button className={`${itemClass(current==='historial')} ${current==='historial' ? 'active' : 'hoverable'}`} onClick={() => onNavigate('historial')} aria-current={current==='historial' ? 'page' : undefined}><span aria-hidden>🕘</span><span className={collapsed ? 'sr-only' : ''}>{L.history}</span></button></li>
            <li><button className={`${itemClass(current==='ayuda')} ${current==='ayuda' ? 'active' : 'hoverable'}`} onClick={() => onNavigate('ayuda')} aria-current={current==='ayuda' ? 'page' : undefined}><span aria-hidden>❓</span><span className={collapsed ? 'sr-only' : ''}>{L.help}</span></button></li>
          </ul>
          <div className="mt-4 border-t border-white/10 pt-2">
            <button className={`${itemClass(false)} hoverable`} onClick={onLogout}><span aria-hidden>🚪</span><span className={collapsed ? 'sr-only' : ''}>{L.logout}</span></button>
          </div>
        </nav>
      </aside>

      {/* CUERPO */}
      <main className="p-4">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="muted text-sm"><strong>{L.where}:</strong> {current}</div>
          {status && (
            <div ref={statusRef} tabIndex={-1} className="card card-body border-green-300 bg-green-50 text-green-800" aria-live="polite">{status}</div>
          )}
          {children}
        </div>
      </main>

      {/* PIE */}
      <footer className="hc-text col-span-2">
        <div className="max-w-6xl mx-auto p-4 text-sm flex flex-wrap gap-4 card">
          <span>© 2025 SaludAsist</span>
          <button type="button" className="underline">Soporte/Contacto</button>
          <button type="button" className="underline">Política y Términos</button>
        </div>
      </footer>
    </div>
  )
}

export type { Page, Lang }
