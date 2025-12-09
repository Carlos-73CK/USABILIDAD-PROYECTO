import { DiagnoseResponse } from '../api'

export function Results({ data, lang = 'es' }: Readonly<{ data: DiagnoseResponse; lang?: 'es' | 'en' }>) {
  const L = {
    es: { title: 'Resultados', confidence: 'Confianza' },
    en: { title: 'Results', confidence: 'Confidence' },
  } as const
  return (
    <section className="grid gap-3" aria-labelledby="results-title">
      <h2 id="results-title" className="text-xl font-semibold">{L[lang].title}</h2>
      <p className="text-sm text-gray-700">{data.disclaimer}</p>
      <ul className="divide-y">
        {data.diagnoses.map((d) => (
          <li key={`${d.condition}-${d.confidence}`} className="py-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{d.condition}</p>
                <p className="text-sm text-gray-700">{d.recommendation}</p>
              </div>
              <span aria-label={`${L[lang].confidence} ${(d.confidence * 100).toFixed(0)}%`}>
                {(d.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
