import React from 'react'
import { User, Plus, X, Lock } from 'lucide-react'

export type UserProfile = {
  email: string
  name: string
  color: string
  token?: string // If present, auto-login
}

type Props = {
  profiles: UserProfile[]
  onSelect: (profile: UserProfile) => void
  onAdd: () => void
  onRemove: (email: string) => void
  lang: 'es' | 'en'
}

export function UserSelectionPage({ profiles, onSelect, onAdd, onRemove, lang }: Props) {
  const L = {
    es: {
      title: '¿Quién está entrando?',
      add: 'Agregar perfil',
      remove: 'Eliminar',
      locked: 'Requiere contraseña'
    },
    en: {
      title: "Who's watching?",
      add: 'Add profile',
      remove: 'Remove',
      locked: 'Password required'
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-fade-in">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">{L[lang].title}</h1>
      
      <div className="flex flex-wrap justify-center gap-6 md:gap-8">
        {profiles.map(p => (
          <div key={p.email} className="group relative flex flex-col items-center gap-3 w-32 md:w-40">
            <button 
              onClick={() => onRemove(p.email)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 focus:opacity-100"
              aria-label={`${L[lang].remove} ${p.name}`}
            >
              <X size={14} />
            </button>
            
            <button 
              onClick={() => onSelect(p)}
              className={`w-24 h-24 md:w-32 md:h-32 rounded-md flex items-center justify-center text-white text-4xl shadow-lg transition-transform hover:scale-105 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-teal-500 relative overflow-hidden`}
              style={{ backgroundColor: p.color }}
              aria-label={p.name}
            >
              {p.name.charAt(0).toUpperCase()}
              {!p.token && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-white/80" />
                </div>
              )}
            </button>
            
            <span className="text-lg font-medium text-center truncate w-full px-2">
              {p.name}
            </span>
            {!p.token && (
              <span className="text-xs text-slate-500 -mt-2">{L[lang].locked}</span>
            )}
          </div>
        ))}

        <div className="flex flex-col items-center gap-3 w-32 md:w-40">
          <button 
            onClick={onAdd}
            className="w-24 h-24 md:w-32 md:h-32 rounded-md border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-teal-500"
            aria-label={L[lang].add}
          >
            <Plus size={40} />
          </button>
          <span className="text-lg font-medium text-slate-500">{L[lang].add}</span>
        </div>
      </div>
    </div>
  )
}
