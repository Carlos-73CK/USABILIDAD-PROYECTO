import React, { useEffect, useMemo, useState } from 'react'
import illLogin from '../assets/illustration-login.svg'
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Check, UserPlus, FileText, X } from 'lucide-react'
import { login, resetPassword } from '../api'

type Props = Readonly<{
  onSuccess: (email: string, name: string, token: string, remember: boolean) => void
  onRegister: () => void
  onTerms: () => void
  defaultEmail?: string
}>

export function LoginPage({ onSuccess, onRegister, onTerms, defaultEmail = '' }: Props) {
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/\d/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    return strength;
  };
  
  const passwordStrength = getPasswordStrength(newPassword);
  
  const getStrengthColor = (strength: number) => {
    if (strength <= 1) return 'bg-red-500';
    if (strength === 2) return 'bg-yellow-500';
    if (strength === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 1) return lang === 'es' ? 'Débil' : 'Weak';
    if (strength === 2) return 'bg-yellow-500';
    if (strength === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };
  
  const lang = useMemo<'es' | 'en'>(() => {
    try { return (localStorage.getItem('lang') === 'en' ? 'en' : 'es') } catch { return 'es' }
  }, [])

  const L = {
    es: {
      access: 'Bienvenido',
      intro: 'Ingresa a tu cuenta para continuar.',
      email: 'Correo electrónico',
      password: 'Contraseña',
      remember: 'Recordar mi usuario',
      forgot: '¿Olvidaste tu contraseña?',
      submit: 'Iniciar Sesión',
      register: 'Crear cuenta nueva',
      terms: 'Términos y Privacidad',
      error: 'Error al iniciar sesión',
      forgotTitle: 'Recuperar Contraseña',
      forgotDesc: 'Ingresa tu correo y la nueva contraseña.',
      sendLink: 'Actualizar Contraseña',
      back: 'Volver al inicio',
      linkSent: 'Contraseña actualizada.',
      newPassword: 'Nueva Contraseña',
      confirmNew: 'Confirmar Nueva Contraseña',
      reqLen: 'Mínimo 8 caracteres',
      reqCap: 'Al menos una mayúscula',
      reqNum: 'Al menos un número',
      reqSym: 'Al menos un símbolo',
      passReq: 'Requisitos:'
    },
    en: {
      access: 'Welcome Back',
      intro: 'Sign in to your account to continue.',
      email: 'Email address',
      password: 'Password',
      remember: 'Remember me',
      forgot: 'Forgot password?',
      submit: 'Sign In',
      register: 'Create new account',
      terms: 'Terms & Privacy',
      error: 'Login failed',
      forgotTitle: 'Recover Password',
      forgotDesc: 'Enter your email and new password.',
      sendLink: 'Update Password',
      back: 'Back to login',
      linkSent: 'Password updated.',
      newPassword: 'New Password',
      confirmNew: 'Confirm New Password',
      reqLen: 'Minimum 8 characters',
      reqCap: 'At least one uppercase letter',
      reqNum: 'At least one number',
      reqSym: 'At least one symbol',
      passReq: 'Requirements:'
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const data = await login(email, password)
      localStorage.setItem('token', data.access_token)
      if (remember) {
        localStorage.setItem('saved_email', email)
      } else {
        localStorage.removeItem('saved_email')
      }
      onSuccess(email, data.user_name || email.split('@')[0], data.access_token, remember)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    if (newPassword !== confirmNewPassword) {
        setError(lang === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match');
        return;
    }
    
    if (passwordStrength < 2) {
        setError(lang === 'es' ? 'La contraseña es muy débil' : 'Password is too weak');
        return;
    }

    setSubmitting(true)
    try {
        await resetPassword(email, newPassword)
        alert(L[lang].linkSent)
        setForgotMode(false)
        setNewPassword('')
        setConfirmNewPassword('')
    } catch (err: any) {
        setError(err.message)
    } finally {
        setSubmitting(false)
    }
  }

  if (forgotMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 animate-fade-in">
        <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{L[lang].forgotTitle}</h2>
          <p className="text-slate-500 mb-6">{L[lang].forgotDesc}</p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center text-sm">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{L[lang].email}</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{L[lang].newPassword}</label>
              <input 
                type="password" 
                required 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200" 
              />
              
              {/* Password Strength Meter */}
              {newPassword && (
                  <div className="mt-2">
                      <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">{L[lang].passReq}</span>
                          <span className="text-xs font-medium text-gray-700">{getStrengthText(passwordStrength)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                          <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`} 
                              style={{ width: `${(passwordStrength / 4) * 100}%` }}
                          ></div>
                      </div>
                      <ul className="mt-2 space-y-1">
                          <li className={`text-xs flex items-center ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                              {newPassword.length >= 8 ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                              {L[lang].reqLen}
                          </li>
                          <li className={`text-xs flex items-center ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                              {/[A-Z]/.test(newPassword) ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                              {L[lang].reqCap}
                          </li>
                          <li className={`text-xs flex items-center ${/\d/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                              {/\d/.test(newPassword) ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                              {L[lang].reqNum}
                          </li>
                           <li className={`text-xs flex items-center ${/[^A-Za-z0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                              {/[^A-Za-z0-9]/.test(newPassword) ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                              {L[lang].reqSym}
                          </li>
                      </ul>
                  </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{L[lang].confirmNew}</label>
              <input 
                type="password" 
                required 
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200" 
              />
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50">
              {submitting ? '...' : L[lang].sendLink}
            </button>
            <button type="button" onClick={() => setForgotMode(false)} className="w-full text-slate-500 py-2">
              {L[lang].back}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 lg:p-8 animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
        
        {/* Left: Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{L[lang].access}</h1>
            <p className="text-slate-500">{L[lang].intro}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100 animate-shake">
              <AlertCircle size={20} />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">{L[lang].email}</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">{L[lang].password}</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={20} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                  {lang === 'es' ? 'Recordar contraseña para ingreso automático' : 'Remember password for automatic login'}
                </span>
              </label>
              <button type="button" onClick={() => setForgotMode(true)} className="text-sm text-teal-600 hover:text-teal-700 font-medium hover:underline">
                {L[lang].forgot}
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-teal-200 hover:bg-teal-700 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={20} />
                  {L[lang].submit}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
            <button onClick={onRegister} className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:text-teal-700 transition-all flex items-center justify-center gap-2">
              <UserPlus size={18} /> {L[lang].register}
            </button>
            <button onClick={onTerms} className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 flex items-center justify-center gap-2">
              <FileText size={14} /> {L[lang].terms}
            </button>
          </div>
        </div>

        {/* Right: Illustration */}
        <div className="hidden lg:flex w-1/2 bg-teal-50 items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-emerald-500/10" />
          <div className="relative z-10 text-center">
            <img src={illLogin} alt="" className="w-full max-w-md mx-auto mb-8 drop-shadow-2xl animate-float" />
            <h3 className="text-2xl font-bold text-teal-900 mb-2">SaludAsist</h3>
            <p className="text-teal-700/80 max-w-xs mx-auto">Tu asistente de diagnóstico inteligente y accesible.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
