import React, { useEffect, useState } from 'react'
import { User, Mail, Lock, Save, AlertCircle, Check, Activity } from 'lucide-react'
import { getProfile, updateProfile, User as UserType } from '../api'

type Props = {
  lang: 'es' | 'en'
}

export function ProfilePage({ lang }: Props) {
  const [profile, setProfile] = useState<UserType | null>(null)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [medicalInfo, setMedicalInfo] = useState('')
  const [requirePassword, setRequirePassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const L = {
    es: {
      title: 'Mi Perfil',
      name: 'Nombre Completo',
      email: 'Correo Electrónico',
      newPass: 'Nueva Contraseña (opcional)',
      save: 'Guardar Cambios',
      loading: 'Cargando perfil...',
      success: 'Perfil actualizado correctamente',
      error: 'Error al actualizar perfil',
      reqPass: 'Solicitar contraseña al iniciar sesión (desactivar ingreso automático)',
      medicalTitle: 'Antecedentes Médicos / Alergias',
      medicalPlaceholder: 'Escribe aquí si tienes alergias, condiciones crónicas o antecedentes importantes...'
    },
    en: {
      title: 'My Profile',
      name: 'Full Name',
      email: 'Email Address',
      newPass: 'New Password (optional)',
      save: 'Save Changes',
      loading: 'Loading profile...',
      success: 'Profile updated successfully',
      error: 'Error updating profile',
      reqPass: 'Require password on login (disable auto-login)',
      medicalTitle: 'Medical History / Allergies',
      medicalPlaceholder: 'Write here if you have allergies, chronic conditions or important history...'
    }
  }

  useEffect(() => {
    getProfile()
      .then(u => {
        setProfile(u)
        setFullName(u.full_name)
        
        // Check local preference
        try {
          const profiles = JSON.parse(localStorage.getItem('app:profiles') || '[]')
          const p = profiles.find((x: any) => x.email === u.email)
          if (p) {
            if (p.token) setRequirePassword(false)
            else setRequirePassword(true)
            
            if (p.medicalInfo) setMedicalInfo(p.medicalInfo)
          } else {
            setRequirePassword(true)
          }
        } catch {
          setRequirePassword(true)
        }
      })
      .catch(() => setMsg({ type: 'error', text: 'Error loading profile' }))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      await updateProfile({ 
        full_name: fullName, 
        password: password || undefined 
      })
      
      // Update local preference
      if (profile) {
        const profiles = JSON.parse(localStorage.getItem('app:profiles') || '[]')
        const idx = profiles.findIndex((x: any) => x.email === profile.email)
        if (idx >= 0) {
          if (requirePassword) {
            delete profiles[idx].token
          } else {
            profiles[idx].token = localStorage.getItem('token')
          }
          // Update name if changed
          profiles[idx].name = fullName
          // Save medical info
          profiles[idx].medicalInfo = medicalInfo
          
          localStorage.setItem('app:profiles', JSON.stringify(profiles))
        }
      }

      setMsg({ type: 'success', text: L[lang].success })
      setPassword('')
    } catch (err) {
      setMsg({ type: 'error', text: L[lang].error })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">{L[lang].loading}</div>

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <User className="text-teal-600" /> {L[lang].title}
      </h2>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        {msg && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{L[lang].email}</label>
            <div className="relative opacity-75">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                value={profile?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{L[lang].name}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{L[lang].newPass}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{L[lang].medicalTitle}</label>
            <div className="relative">
              <Activity className="absolute left-3 top-3 text-slate-400" size={18} />
              <textarea 
                value={medicalInfo}
                onChange={e => setMedicalInfo(e.target.value)}
                placeholder={L[lang].medicalPlaceholder}
                rows={4}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <input 
              type="checkbox" 
              id="reqPass"
              checked={requirePassword}
              onChange={(e) => setRequirePassword(e.target.checked)}
              className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <label htmlFor="reqPass" className="text-sm text-slate-700 cursor-pointer select-none">
              {L[lang].reqPass}
            </label>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} /> {L[lang].save}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
