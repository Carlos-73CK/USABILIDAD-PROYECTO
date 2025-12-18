import React, { useEffect, useMemo, useRef, useState } from 'react'
import { 
  Accessibility, X, Eye, Type, Volume2, 
  Sun, Moon, Contrast, MousePointer, 
  Ear, ZoomIn, ZoomOut, 
  Zap, Bell, Coffee, ArrowDownCircle
} from 'lucide-react'

type Prefs = {
  underlineLinks: boolean
  largeTargets: boolean
  letterSpacing: number // em delta
  lineHeight: number // multiplier
  theme: 'default' | 'hc' | 'dark' | 'sepia'
  hoverSpeak: boolean
  fontType: 'default' | 'dyslexic' | 'sans' | 'serif'
  fontSize: number // multiplier (0.85 - 1.5)
  visualAlerts: boolean
  pauseAnimations: boolean
  enhancedFocus: boolean
  autoScroll: boolean
}

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem('a11y:prefs')
    if (raw) return JSON.parse(raw)
  } catch {
    // almacenamiento no disponible
  }
  return { 
    underlineLinks: false, 
    largeTargets: false, 
    letterSpacing: 0, 
    lineHeight: 1, 
    theme: 'default', 
    hoverSpeak: false, 
    fontType: 'default',
    fontSize: 1,
    visualAlerts: false,
    pauseAnimations: false,
    enhancedFocus: false,
    autoScroll: false
  }
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
      themeLegend: 'Apariencia',
      themeDefault: 'Claro',
      themeDark: 'Oscuro',
      themeHC: 'Alto Contraste',
      themeSepia: 'Sepia',
      underline: 'Subrayar enlaces',
      targets: 'Botones grandes',
      hoverSpeak: 'Lectura al pasar cursor',
      stopVoice: 'Detener voz',
      spacingLegend: 'Legibilidad',
      letter: 'Espaciado',
      line: 'Interlineado',
      fontLegend: 'Tipografía',
      fontDefault: 'Original',
      fontDyslexic: 'Dislexia',
      fontSans: 'Sans Serif',
      fontSerif: 'Serif',
      auditory: 'Ayudas Auditivas',
      auditoryText: 'Este sitio es compatible con lectores de pantalla. No hay reproducción automática.',
      reset: 'Restablecer todo',
      zoom: 'Tamaño de texto',
      visualAlerts: 'Alertas visuales',
      pauseAnimations: 'Pausar animaciones',
      enhancedFocus: 'Foco visible mejorado',
      autoScroll: 'Auto-desplazamiento'
    },
    en: {
      open: 'Open accessibility menu',
      title: 'Accessibility',
      close: 'Close',
      themeLegend: 'Appearance',
      themeDefault: 'Light',
      themeDark: 'Dark',
      themeHC: 'High Contrast',
      themeSepia: 'Sepia',
      underline: 'Underline links',
      targets: 'Large buttons',
      hoverSpeak: 'Speak on hover',
      stopVoice: 'Stop voice',
      spacingLegend: 'Readability',
      letter: 'Spacing',
      line: 'Line height',
      fontLegend: 'Typography',
      fontDefault: 'Default',
      fontDyslexic: 'Dyslexia',
      fontSans: 'Sans Serif',
      fontSerif: 'Serif',
      auditory: 'Auditory Help',
      auditoryText: 'This site supports screen readers. No auto-play media.',
      reset: 'Reset all',
      zoom: 'Text size',
      visualAlerts: 'Visual alerts',
      pauseAnimations: 'Pause animations',
      enhancedFocus: 'Enhanced focus',
      autoScroll: 'Auto-scroll'
    },
  } as const

  // Sincronizar preferencias con el DOM
  useEffect(() => {
    if (prefs.theme === 'default') {
      delete document.documentElement.dataset.theme
    } else {
      document.documentElement.dataset.theme = prefs.theme
    }
    document.body.classList.toggle('a11y-underline-links', prefs.underlineLinks)
    document.body.classList.toggle('a11y-large-targets', prefs.largeTargets)
    document.body.classList.toggle('a11y-paused', prefs.pauseAnimations)
    document.body.classList.toggle('a11y-enhanced-focus', prefs.enhancedFocus)
    
    document.documentElement.style.setProperty('--ls', `${prefs.letterSpacing}em`)
    document.documentElement.style.setProperty('--lh', `${prefs.lineHeight}`)
    
    // Font Size Logic
    const clamped = Math.min(2.0, Math.max(0.75, prefs.fontSize))
    document.documentElement.style.setProperty('font-size', `${clamped * 100}%`, 'important')

    document.body.classList.remove('font-dyslexic', 'font-sans', 'font-serif')
    if (prefs.fontType === 'dyslexic') document.body.classList.add('font-dyslexic')
    if (prefs.fontType === 'sans') document.body.classList.add('font-sans') // Tailwind default, but explicit
    if (prefs.fontType === 'serif') document.body.classList.add('font-serif')

    writePrefs(prefs)
    window.dispatchEvent(new CustomEvent('a11y-prefs-changed', { detail: prefs }))
  }, [prefs])

  // Auto-scroll logic
  useEffect(() => {
    if (!prefs.autoScroll) return

    let animationFrameId: number
    let scrollSpeed = 0
    const threshold = 150 // pixels from top/bottom (zona activa)
    const maxSpeed = 10 // pixels per frame (velocidad máxima)

    const handleMouseMove = (e: MouseEvent) => {
      const { clientY } = e
      const { innerHeight } = window
      
      if (clientY < threshold) {
        // Top zone: scroll up
        // Speed increases as we get closer to the edge
        const intensity = (threshold - clientY) / threshold
        scrollSpeed = -maxSpeed * intensity
      } else if (clientY > innerHeight - threshold) {
        // Bottom zone: scroll down
        const intensity = (clientY - (innerHeight - threshold)) / threshold
        scrollSpeed = maxSpeed * intensity
      } else {
        scrollSpeed = 0
      }
    }

    const scrollLoop = () => {
      if (scrollSpeed !== 0) {
        window.scrollBy(0, scrollSpeed)
      }
      animationFrameId = requestAnimationFrame(scrollLoop)
    }

    window.addEventListener('mousemove', handleMouseMove)
    animationFrameId = requestAnimationFrame(scrollLoop)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [prefs.autoScroll])

  // Lectura por voz al hacer hover
  useEffect(() => {
    if (!prefs.hoverSpeak) return
    
    let currentUtterance: SpeechSynthesisUtterance | null = null

    function onMouseOver(e: MouseEvent) {
      const target = e.target as HTMLElement
      // Buscar texto relevante
      const text = target.innerText || target.getAttribute('aria-label') || (target as HTMLImageElement).alt
      if (!text || text.trim().length === 0) return
      
      // Evitar leer contenedores grandes, solo elementos hoja o interactivos
      const isInteractive = target.matches('button, a, input, select, [role="button"]')
      const isText = target.matches('p, h1, h2, h3, h4, h5, h6, span, li, label')
      
      if (isInteractive || isText) {
        window.speechSynthesis.cancel()
        currentUtterance = new SpeechSynthesisUtterance(text)
        currentUtterance.lang = lang === 'en' ? 'en-US' : 'es-ES'
        window.speechSynthesis.speak(currentUtterance)
      }
    }

    function onMouseOut() {
      window.speechSynthesis.cancel()
    }

    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mouseout', onMouseOut)
    return () => {
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mouseout', onMouseOut)
      window.speechSynthesis.cancel()
    }
  }, [prefs.hoverSpeak, lang])

  function update(p: Partial<Prefs>) {
    setPrefs(prev => ({ ...prev, ...p }))
  }

  function reset() {
    setPrefs({ 
      underlineLinks: false, 
      largeTargets: false, 
      letterSpacing: 0, 
      lineHeight: 1, 
      theme: 'default', 
      hoverSpeak: false, 
      fontType: 'default',
      fontSize: 1,
      visualAlerts: false,
      pauseAnimations: false,
      enhancedFocus: false,
      autoScroll: false
    })
  }

  function incZoom() {
    const next = Math.min(2.0, +(Math.round((prefs.fontSize + 0.1) * 10) / 10).toFixed(1))
    update({ fontSize: next })
  }
  function decZoom() {
    const next = Math.max(0.75, +(Math.round((prefs.fontSize - 0.1) * 10) / 10).toFixed(1))
    update({ fontSize: next })
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-teal-600 text-white shadow-lg shadow-teal-900/20 hover:bg-teal-700 hover:scale-110 transition-all flex items-center justify-center focus:ring-4 focus:ring-teal-300 focus:outline-none"
        aria-label={L[lang].open}
        title={L[lang].title}
      >
        <Accessibility size={28} />
      </button>

      {/* Panel Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:pr-6 sm:pb-20 p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto border border-slate-200 animate-slide-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="a11y-title"
          >
            <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-100 p-4 flex items-center justify-between z-10">
              <h2 id="a11y-title" className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Accessibility className="text-teal-600" />
                {L[lang].title}
              </h2>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors" aria-label={L[lang].close}>
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              
              {/* Theme */}
              <section>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Eye size={16} /> {L[lang].themeLegend}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => update({ theme: 'default' })}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-sm font-medium transition-all ${prefs.theme === 'default' ? 'bg-teal-50 border-teal-500 text-teal-700 ring-1 ring-teal-500' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <Sun size={20} />
                    {L[lang].themeDefault}
                  </button>
                  <button 
                    onClick={() => update({ theme: 'dark' })}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-sm font-medium transition-all ${prefs.theme === 'dark' ? 'bg-slate-800 border-slate-900 text-white ring-1 ring-slate-900' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <Moon size={20} />
                    {L[lang].themeDark}
                  </button>
                  <button 
                    onClick={() => update({ theme: 'hc' })}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-sm font-medium transition-all ${prefs.theme === 'hc' ? 'bg-black border-black text-yellow-400 ring-1 ring-black' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <Contrast size={20} />
                    {L[lang].themeHC}
                  </button>
                  <button 
                    onClick={() => update({ theme: 'sepia' })}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-sm font-medium transition-all ${prefs.theme === 'sepia' ? 'bg-[#fdf6e3] border-[#a67c52] text-[#5b4636] ring-1 ring-[#a67c52]' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <Coffee size={20} />
                    {L[lang].themeSepia}
                  </button>
                </div>
              </section>

              {/* Typography */}
              <section>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Type size={16} /> {L[lang].fontLegend}
                </h3>
                
                {/* Zoom Control */}
                <div className="bg-slate-50 rounded-xl p-3 mb-4 flex items-center justify-between border border-slate-200">
                  <span className="text-sm font-medium text-slate-700">{L[lang].zoom}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={decZoom} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all" aria-label="Disminuir"><ZoomOut size={18} /></button>
                    <span className="w-12 text-center font-mono font-bold text-teal-700">{(prefs.fontSize * 100).toFixed(0)}%</span>
                    <button onClick={incZoom} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all" aria-label="Aumentar"><ZoomIn size={18} /></button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button onClick={() => update({ fontType: 'default' })} className={`px-3 py-2 rounded-lg text-sm border ${prefs.fontType === 'default' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-slate-200'}`}>{L[lang].fontDefault}</button>
                  <button onClick={() => update({ fontType: 'dyslexic' })} className={`px-3 py-2 rounded-lg text-sm border font-dyslexic ${prefs.fontType === 'dyslexic' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-slate-200'}`}>{L[lang].fontDyslexic}</button>
                  <button onClick={() => update({ fontType: 'sans' })} className={`px-3 py-2 rounded-lg text-sm border font-sans ${prefs.fontType === 'sans' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-slate-200'}`}>{L[lang].fontSans}</button>
                  <button onClick={() => update({ fontType: 'serif' })} className={`px-3 py-2 rounded-lg text-sm border font-serif ${prefs.fontType === 'serif' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-slate-200'}`}>{L[lang].fontSerif}</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{L[lang].letter}</span>
                      <span className="text-slate-400">{prefs.letterSpacing}em</span>
                    </div>
                    <input 
                      type="range" min="0" max="0.5" step="0.05" 
                      value={prefs.letterSpacing} 
                      onChange={(e) => update({ letterSpacing: parseFloat(e.target.value) })}
                      className="w-full accent-teal-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{L[lang].line}</span>
                      <span className="text-slate-400">{prefs.lineHeight}x</span>
                    </div>
                    <input 
                      type="range" min="1" max="2" step="0.1" 
                      value={prefs.lineHeight} 
                      onChange={(e) => update({ lineHeight: parseFloat(e.target.value) })}
                      className="w-full accent-teal-600"
                    />
                  </div>
                </div>
              </section>

              {/* Interaction */}
              <section>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MousePointer size={16} /> Interacción
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <span className="text-sm font-medium">{L[lang].underline}</span>
                    <input type="checkbox" checked={prefs.underlineLinks} onChange={(e) => update({ underlineLinks: e.target.checked })} className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500" />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <span className="text-sm font-medium">{L[lang].targets}</span>
                    <input type="checkbox" checked={prefs.largeTargets} onChange={(e) => update({ largeTargets: e.target.checked })} className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500" />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Volume2 size={16} /> {L[lang].hoverSpeak}
                    </span>
                    <input type="checkbox" checked={prefs.hoverSpeak} onChange={(e) => update({ hoverSpeak: e.target.checked })} className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500" />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Bell size={16} /> {L[lang].visualAlerts}
                    </span>
                    <input type="checkbox" checked={prefs.visualAlerts} onChange={(e) => update({ visualAlerts: e.target.checked })} className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500" />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Zap size={16} /> {L[lang].pauseAnimations}
                    </span>
                    <input type="checkbox" checked={prefs.pauseAnimations} onChange={(e) => update({ pauseAnimations: e.target.checked })} className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500" />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <MousePointer size={16} /> {L[lang].enhancedFocus}
                    </span>
                    <input type="checkbox" checked={prefs.enhancedFocus} onChange={(e) => update({ enhancedFocus: e.target.checked })} className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500" />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <ArrowDownCircle size={16} /> {L[lang].autoScroll}
                    </span>
                    <input type="checkbox" checked={prefs.autoScroll} onChange={(e) => update({ autoScroll: e.target.checked })} className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500" />
                  </label>
                </div>
              </section>

              {/* Auditory Info */}
              <section className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="text-sm font-bold text-blue-800 mb-1 flex items-center gap-2">
                  <Ear size={16} /> {L[lang].auditory}
                </h3>
                <p className="text-xs text-blue-700 leading-relaxed">
                  {L[lang].auditoryText}
                </p>
              </section>

              <button onClick={reset} className="w-full py-2 text-sm text-slate-400 hover:text-red-500 transition-colors">
                {L[lang].reset}
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  )
}
