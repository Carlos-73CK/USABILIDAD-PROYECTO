import React, { useEffect, useMemo, useRef, useState } from 'react'
import { A11yBar } from './A11yBar'

type Prefs = {
  underlineLinks: boolean
  largeTargets: boolean
  letterSpacing: number // em delta
  lineHeight: number // multiplier
  theme: 'default' | 'hc' | 'dark'
  hoverSpeak: boolean
}

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem('a11y:prefs')
    if (raw) return JSON.parse(raw)
  } catch {
    // almacenamiento no disponible
  }
  return { underlineLinks: false, largeTargets: false, letterSpacing: 0, lineHeight: 1, theme: 'default', hoverSpeak: false }
}

function writePrefs(p: Prefs) {
  try {
    localStorage.setItem('a11y:prefs', JSON.stringify(p))
  } catch {
    // almacenamiento no disponible
  }
}

export function AccessibilityMenu() {
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>(() => readPrefs())
  const panelRef = useRef<HTMLDialogElement | null>(null)
  const lang = useMemo<'es' | 'en'>(() => {
    try { return (localStorage.getItem('lang') === 'en' ? 'en' : 'es') } catch { return (document.documentElement.lang === 'en' ? 'en' : 'es') }
  }, [])
  const L = {
    es: {
      open: 'Abrir menú de accesibilidad',
      title: 'Accesibilidad',
      close: 'Cerrar',
      themeLegend: 'Tema',
      themeDefault: 'Predeterminado',
      themeDark: 'Oscuro',
      themeHC: 'Alto contraste',
      underline: 'Resaltar enlaces (subrayado permanente)',
      targets: 'Botones y objetivos más grandes',
      hoverSpeak: 'Lectura por voz (al pasar el cursor)',
      stopVoice: 'Detener voz',
      spacingLegend: 'Espaciado de texto',
      letter: 'Espaciado letras',
      line: 'Altura de línea',
      auditory: 'Opciones auditivas',
      auditoryText: 'No usamos audio ni video con reproducción automática. Si añadimos multimedia, incluiremos controles de pausa, subtítulos y transcripción.',
    },
    en: {
      open: 'Open accessibility menu',
      title: 'Accessibility',
      close: 'Close',
      themeLegend: 'Theme',
      themeDefault: 'Default',
      themeDark: 'Dark',
      themeHC: 'High contrast',
      underline: 'Underline links (permanently)',
      targets: 'Larger buttons and targets',
      hoverSpeak: 'Read text on hover',
      stopVoice: 'Stop voice',
      spacingLegend: 'Text spacing',
      letter: 'Letter spacing',
      line: 'Line height',
      auditory: 'Auditory options',
      auditoryText: 'We do not auto-play audio or video. If we add media, we will include pause controls, captions, and transcripts.',
    },
  } as const

  // Sincronizar preferencias con el DOM
  useEffect(() => {
    // Tema: establecer o limpiar el data-theme en <html>
    if (prefs.theme === 'default') {
      delete document.documentElement.dataset.theme
    } else {
      document.documentElement.dataset.theme = prefs.theme
    }
    document.body.classList.toggle('a11y-underline-links', prefs.underlineLinks)
    document.body.classList.toggle('a11y-large-targets', prefs.largeTargets)
    document.documentElement.style.setProperty('--ls', `${prefs.letterSpacing}em`)
    document.documentElement.style.setProperty('--lh', `${prefs.lineHeight}`)
    writePrefs(prefs)
  }, [prefs])

  // Al montar, si ya hay un data-theme aplicado (p.ej., por A11yBar o por última sesión), sincronizar estado
  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Prefs['theme'] | undefined) || 'default'
    if (current !== prefs.theme) {
      setPrefs((p) => ({ ...p, theme: current }))
    }
    // También, si existía configuración antigua en localStorage ('a11y:theme'), respetarla si no hay prefs previas
    try {
      const legacy = localStorage.getItem('a11y:theme') as Prefs['theme'] | null
      if (legacy && legacy !== prefs.theme) setPrefs((p) => ({ ...p, theme: legacy }))
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Narrador al pasar el cursor (Web Speech API)
  const lastUtterRef = useRef<string>('')
  const lastTimeRef = useRef<number>(0)
  useEffect(() => {
    function getLabel(el: Element | null): string | null {
      if (!el) return null
      // aria-label directo
      const aria = (el as HTMLElement).getAttribute?.('aria-label')
      if (aria && aria.trim().length > 1) return aria.trim()
      // aria-labelledby
      const lblIds = (el as HTMLElement).getAttribute?.('aria-labelledby')
      if (lblIds) {
        const t = lblIds.split(/\s+/).map((id) => document.getElementById(id)?.textContent?.trim() || '').join(' ').trim()
        if (t) return t
      }
      // imágenes
      const alt = (el as HTMLImageElement).alt
      if (alt && alt.trim().length > 1) return alt.trim()
      // inputs: placeholder
      if (el instanceof HTMLInputElement && el.placeholder) return el.placeholder.trim()
      // label asociado
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        if (el.id) {
          const lab = document.querySelector(`label[for="${el.id}"]`) as HTMLLabelElement | null
          if (lab?.textContent) return lab.textContent.trim()
        }
      }
      // texto del elemento
      const txt = (el as HTMLElement).textContent?.replace(/\s+/g, ' ').trim() || ''
      return txt || null
    }

    function speak(text: string) {
      try { globalThis.speechSynthesis.cancel() } catch { /* no speech */ }
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = document.documentElement.lang || 'es-ES'
      try { globalThis.speechSynthesis.speak(utter) } catch { /* no speech */ }
    }

    function onOver(e: MouseEvent) {
      const now = performance.now()
      if (now - lastTimeRef.current < 300) return // throttle
      const target = e.target as Element
      // Buscar el elemento más informativo cercano
      const el = (target.closest('[aria-label]') as Element) || target
      const text = getLabel(el)
      if (!text) return
      const t = text.slice(0, 120)
      if (t === lastUtterRef.current) return
      lastUtterRef.current = t
      lastTimeRef.current = now
      speak(t)
    }

    if (prefs.hoverSpeak) {
      globalThis.addEventListener('mouseover', onOver)
    }
    return () => {
      if (prefs.hoverSpeak) {
        globalThis.removeEventListener('mouseover', onOver)
        try { globalThis.speechSynthesis.cancel() } catch { /* no speech */ }
      }
    }
  }, [prefs.hoverSpeak])

  // Acceso rápido por teclado Alt+Shift+A y Escape para cerrar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.altKey && e.shiftKey && (e.key === 'A' || e.key === 'a'))) {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    globalThis.addEventListener('keydown', onKey)
    return () => globalThis.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open && panelRef.current) panelRef.current.focus()
  }, [open])

  return (
    <>
      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-40 rounded-full bg-blue-700 text-white w-12 h-12 text-2xl shadow-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-yellow-300"
        aria-label={L[lang].open}
      >
        ♿
      </button>

      {/* Overlay y panel lateral */}
      {open && (
        <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}
      <dialog
        aria-label={L[lang].title}
        open={open}
        className={`fixed top-0 right-0 h-full w-80 max-w-[90vw] z-50 transform bg-white hc-bg hc-text shadow-xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'} m-0 p-0`}
        ref={panelRef}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{L[lang].title}</h2>
          <button onClick={() => setOpen(false)} className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50" aria-label={L[lang].close}>✕</button>
        </div>
        <div className="p-4 space-y-4">
          {/* Contraste y tamaño (barra compacta) */}
          <A11yBar />

          {/* Tema (mutuamente excluyente) */}
          <fieldset>
            <legend className="font-medium mb-1">{L[lang].themeLegend}</legend>
            <div className="grid gap-2">
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="theme" checked={prefs.theme === 'default'} onChange={() => setPrefs((p) => ({ ...p, theme: 'default' }))} />
                <span>{L[lang].themeDefault}</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="theme" checked={prefs.theme === 'dark'} onChange={() => setPrefs((p) => ({ ...p, theme: 'dark' }))} />
                <span>{L[lang].themeDark}</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="theme" checked={prefs.theme === 'hc'} onChange={() => setPrefs((p) => ({ ...p, theme: 'hc' }))} />
                <span>{L[lang].themeHC}</span>
              </label>
            </div>
          </fieldset>

          {/* Subrayado de enlaces */}
          <div>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={prefs.underlineLinks} onChange={(e) => setPrefs((p) => ({ ...p, underlineLinks: e.target.checked }))} />
              <span>{L[lang].underline}</span>
            </label>
          </div>

          {/* Botones/targets grandes */}
          <div>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={prefs.largeTargets} onChange={(e) => setPrefs((p) => ({ ...p, largeTargets: e.target.checked }))} />
              <span>{L[lang].targets}</span>
            </label>
          </div>

          {/* Lectura por voz al pasar el cursor */}
          <div>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={prefs.hoverSpeak} onChange={(e) => setPrefs((p) => ({ ...p, hoverSpeak: e.target.checked }))} />
              <span>{L[lang].hoverSpeak}</span>
            </label>
            {prefs.hoverSpeak && (
              <div className="mt-2">
                <button type="button" className="px-2 py-1 border rounded" onClick={() => { try { globalThis.speechSynthesis.cancel() } catch { /* no speech */ } }}>{L[lang].stopVoice}</button>
              </div>
            )}
          </div>

          {/* Espaciado de texto */}
          <fieldset className="space-y-2">
            <legend className="font-medium">{L[lang].spacingLegend}</legend>
            <div className="flex items-center gap-2">
              <label htmlFor="ls" className="w-32 text-sm">{L[lang].letter}</label>
              <button className="px-2 py-1 border rounded" onClick={() => setPrefs((p) => ({ ...p, letterSpacing: Math.max(0, +(p.letterSpacing - 0.02).toFixed(2)) }))}>−</button>
              <output id="ls" className="text-sm tabular-nums" aria-live="polite">{(prefs.letterSpacing * 100).toFixed(0)}%</output>
              <button className="px-2 py-1 border rounded" onClick={() => setPrefs((p) => ({ ...p, letterSpacing: Math.min(0.2, +(p.letterSpacing + 0.02).toFixed(2)) }))}>＋</button>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="lh" className="w-32 text-sm">{L[lang].line}</label>
              <button className="px-2 py-1 border rounded" onClick={() => setPrefs((p) => ({ ...p, lineHeight: Math.max(1, +(p.lineHeight - 0.05).toFixed(2)) }))}>−</button>
              <output id="lh" className="text-sm tabular-nums" aria-live="polite">{(prefs.lineHeight * 100).toFixed(0)}%</output>
              <button className="px-2 py-1 border rounded" onClick={() => setPrefs((p) => ({ ...p, lineHeight: Math.min(2, +(p.lineHeight + 0.05).toFixed(2)) }))}>＋</button>
            </div>
          </fieldset>

          {/* Ayudas auditivas (informativo) */}
          <details className="mt-2">
            <summary className="cursor-pointer">{L[lang].auditory}</summary>
            <p className="text-sm mt-1">{L[lang].auditoryText}</p>
          </details>
        </div>
  </dialog>
    </>
  )
}
