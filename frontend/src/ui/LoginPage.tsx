import React, { useEffect, useMemo, useRef, useState } from 'react'
import illLogin from '../assets/illustration-login.svg'

type Props = Readonly<{
  onSuccess: (email: string) => void
  defaultEmail?: string
}>

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function passwordScore(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw)) score++
  if (/[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^\w\s]/.test(pw)) score++
  return Math.min(score, 5)
}

function scoreLabel(score: number, lang: 'es' | 'en') {
  if (lang === 'en') {
    if (score <= 1) return 'Very weak'
    if (score === 2) return 'Weak'
    if (score === 3) return 'Medium'
    if (score === 4) return 'Strong'
    return 'Very strong'
  }
  if (score <= 1) return 'Muy débil'
  if (score === 2) return 'Débil'
  if (score === 3) return 'Media'
  if (score === 4) return 'Fuerte'
  return 'Muy fuerte'
}

const labels = {
  es: {
    access: 'Acceso al sistema',
    intro: 'Ingresa tu correo y contraseña. Ejemplo de correo: usuario@dominio.com',
    email: 'Correo electrónico',
    emailHint: 'Ej.: nombre.apellido@ejemplo.com',
    password: 'Contraseña',
    pwPlaceholder: 'Mínimo 8 caracteres, combina mayúsculas, números y símbolos',
    strength: 'Fortaleza',
    remember: 'Recordar usuario',
    forgot: '¿Olvidaste tu contraseña?',
    forgotMsg: 'Te ayudaremos a recuperar el acceso desde tu correo registrado.',
    submit: 'Iniciar sesión',
    help: 'Usa Tab para navegar por los campos. No hay temporizadores ni animaciones.',
    show: 'Mostrar',
    hide: 'Ocultar',
    done: 'Inicio de sesión completado correctamente. Tiempo',
  },
  en: {
    access: 'System access',
    intro: 'Enter your email and password. Example: user@domain.com',
    email: 'Email',
    emailHint: 'E.g.: name.lastname@example.com',
    password: 'Password',
    pwPlaceholder: 'At least 8 chars, mix uppercase, numbers and symbols',
    strength: 'Strength',
    remember: 'Remember me',
    forgot: 'Forgot your password?',
    forgotMsg: 'We’ll help you recover access via your registered email.',
    submit: 'Sign in',
    help: 'Use Tab to move between fields. No timers or animations.',
    show: 'Show',
    hide: 'Hide',
    done: 'Sign-in completed successfully. Time',
  }
} as const

export function LoginPage({ onSuccess, defaultEmail = '' }: Props) {
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const startRef = useRef<number | null>(null)
  const lang = useMemo<'es' | 'en'>(() => {
    try { return (localStorage.getItem('lang') === 'en' ? 'en' : 'es') } catch { return 'es' }
  }, [])
  useEffect(() => {
    // Reflejar idioma efectivo en <html> también aquí por consistencia
    document.documentElement.lang = lang
  }, [lang])

  const emailOk = useMemo(() => validateEmail(email), [email])
  const pwScore = useMemo(() => passwordScore(password), [password])
  const pwOk = pwScore >= 3

  useEffect(() => {
    startRef.current = performance.now()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    if (!emailOk) {
      document.getElementById('email')?.focus()
      return
    }
    if (!pwOk) {
      document.getElementById('password')?.focus()
      return
    }
    setSubmitting(true)
    // Simula validación inmediata sin temporizadores arbitrarios
    setTimeout(() => {
      if (remember) {
        try { localStorage.setItem('rememberedEmail', email) } catch { /* storage not available */ }
      }
      const elapsed = startRef.current ? Math.round((performance.now() - startRef.current) / 1000) : 0
      setStatus(`${labels[lang].done}: ${elapsed}s`)
      setSubmitting(false)
      onSuccess(email)
    }, 50)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <section className="w-full max-w-4xl">
        <div className="grid md:grid-cols-2 gap-4 items-center">
          <div className="card overflow-hidden">
            <div className="card-body">
              <header className="mb-4">
                <h1 className="text-2xl font-bold">{labels[lang].access}</h1>
                <p className="text-sm muted">{labels[lang].intro}</p>
              </header>
        <form onSubmit={handleSubmit} noValidate className="grid gap-4" aria-describedby="login-help">
          <div>
            <label htmlFor="email" className="font-medium flex items-center gap-2">{labels[lang].email} {emailOk ? '✓' : '✗'}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input w-full"
              placeholder="usuario@dominio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!emailOk}
              aria-describedby="email-hint"
            />
            <p id="email-hint" className="text-xs muted">{labels[lang].emailHint}</p>
          </div>

          <div>
            <label htmlFor="password" className="font-medium flex items-center gap-2">{labels[lang].password} {pwOk ? '✓' : '✗'}</label>
            <div className="flex gap-2">
              <input
                id="password"
                name="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="input w-full"
                placeholder={labels[lang].pwPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!pwOk}
                aria-describedby="pw-meter pw-hint"
              />
              <button
                type="button"
                className="btn"
                aria-pressed={showPw}
                onClick={() => setShowPw((v) => !v)}
              >{showPw ? `🙈 ${labels[lang].hide}` : `👁 ${labels[lang].show}`}</button>
            </div>

            {/* Medidor de fortaleza */}
            <div className="mt-2" id="pw-meter" aria-live="polite">
              <meter min={0} max={5} value={pwScore} className="w-full"></meter>
              <div className="text-xs muted">{labels[lang].strength}: {scoreLabel(pwScore, lang)}</div>
            </div>
            <p id="pw-hint" className="text-xs muted">Consejo: usa frases largas, mezcla mayúsculas, números y símbolos.</p>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>{labels[lang].remember}</span>
            </label>
            <button type="button" className="ml-auto underline" onClick={() => setStatus(labels[lang].forgotMsg)}>{labels[lang].forgot}</button>
          </div>

          <div>
            <button
              type="submit"
              disabled={!emailOk || !pwOk || submitting}
              className="btn btn-primary disabled:opacity-60"
            >🔒 {labels[lang].submit}</button>
          </div>
          <p id="login-help" className="sr-only">{labels[lang].help}</p>
        </form>
            </div>
          </div>
          <aside className="card">
            <div className="card-body grid gap-3">
              <img src={illLogin} alt="" aria-hidden className="w-full rounded" />
              <div>
                <h2 className="font-semibold mb-1">{lang==='en' ? 'Your data, protected' : 'Tus datos, protegidos'}</h2>
                <ul className="text-sm list-disc pl-5 space-y-1 muted">
                  <li>{lang==='en' ? 'We only use your input to generate a preliminary assessment.' : 'Usamos tus datos solo para generar un prediagnóstico.'}</li>
                  <li>{lang==='en' ? 'No auto-playing media; keyboard navigation supported.' : 'Sin reproducción automática; navegación con teclado soportada.'}</li>
                  <li>{lang==='en' ? 'You can change theme and font size at any time.' : 'Puedes cambiar tema y tamaño de letra cuando quieras.'}</li>
                </ul>
              </div>
              <div className="text-xs muted">
                {lang==='en' ? 'Tip: Use Alt+Shift+A to open the accessibility menu.' : 'Tip: Usa Alt+Shift+A para abrir el menú de accesibilidad.'}
              </div>
            </div>
          </aside>
        </div>
        <div className="mt-4" aria-live="polite" aria-atomic="true">
          {status && <output className="text-green-700">{status}</output>}
        </div>
      </section>
    </main>
  )
}
