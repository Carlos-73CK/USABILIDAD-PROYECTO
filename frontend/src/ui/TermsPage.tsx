import React from 'react'
import { Shield, FileText, ArrowLeft } from 'lucide-react'

type Props = {
  onBack: () => void
  lang: 'es' | 'en'
}

export function TermsPage({ onBack, lang }: Props) {
  const L = {
    es: {
      title: 'Términos y Privacidad',
      back: 'Volver',
      terms: 'Términos de Uso',
      privacy: 'Política de Privacidad',
      t1: 'El uso de esta aplicación es responsabilidad del usuario.',
      t2: 'Los diagnósticos son preliminares y no sustituyen la opinión médica profesional.',
      p1: 'Sus datos personales se almacenan de forma segura.',
      p2: 'No compartimos su información con terceros sin su consentimiento.'
    },
    en: {
      title: 'Terms & Privacy',
      back: 'Back',
      terms: 'Terms of Use',
      privacy: 'Privacy Policy',
      t1: 'Use of this application is at the user\'s own risk.',
      t2: 'Diagnoses are preliminary and do not replace professional medical advice.',
      p1: 'Your personal data is stored securely.',
      p2: 'We do not share your information with third parties without consent.'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-teal-600 mb-6 transition-colors">
          <ArrowLeft size={20} /> {L[lang].back}
        </button>

        <h1 className="text-3xl font-bold text-slate-800 mb-8">{L[lang].title}</h1>

        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-teal-700 mb-4 flex items-center gap-2">
              <FileText /> {L[lang].terms}
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>{L[lang].t1}</li>
              <li>{L[lang].t2}</li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-teal-700 mb-4 flex items-center gap-2">
              <Shield /> {L[lang].privacy}
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>{L[lang].p1}</li>
              <li>{L[lang].p2}</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
