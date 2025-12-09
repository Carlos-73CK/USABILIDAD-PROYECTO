import React, { useEffect, useState } from 'react'

type Theme = 'default' | 'hc'

function getStored<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    if (!v) return fallback
    return JSON.parse(v) as T
  } catch {
    return fallback
  }
}

function setStored<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export function A11yBar() {
  const [theme, setTheme] = useState<Theme>(() => getStored<Theme>('a11y:theme', 'default'))
  const [fontScale, setFontScale] = useState<number>(() => getStored<number>('a11y:fontScale', 1))

  useEffect(() => {
    // Preferir dataset por linting
    document.documentElement.dataset.theme = theme
    setStored('a11y:theme', theme)
  }, [theme])

  useEffect(() => {
    const clamped = Math.min(1.5, Math.max(0.85, fontScale))
    document.documentElement.style.fontSize = `${clamped * 100}%`
    if (clamped !== fontScale) setFontScale(clamped)
    setStored('a11y:fontScale', clamped)
  }, [fontScale])

  function inc() { setFontScale((v) => +(Math.round((v + 0.1) * 10) / 10).toFixed(1)) }
  function dec() { setFontScale((v) => +(Math.round((v - 0.1) * 10) / 10).toFixed(1)) }
  function reset() { setFontScale(1) }

  const isHC = theme === 'hc'

  return (
    <fieldset className="flex items-center gap-2 text-sm">
      <legend className="sr-only">Controles de accesibilidad</legend>
      <button
        type="button"
        onClick={() => setTheme(isHC ? 'default' : 'hc')}
        className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
        aria-pressed={isHC}
      >
        Alto contraste: {isHC ? 'ON' : 'OFF'}
      </button>
      <div className="flex items-center gap-1" aria-label="Tamaño de fuente">
        <button
          type="button"
          onClick={dec}
          className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Disminuir tamaño de fuente"
        >A-</button>
        <button
          type="button"
          onClick={reset}
          className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Restablecer tamaño de fuente"
        >A</button>
        <button
          type="button"
          onClick={inc}
          className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Aumentar tamaño de fuente"
        >A+</button>
      </div>
    </fieldset>
  )
}
