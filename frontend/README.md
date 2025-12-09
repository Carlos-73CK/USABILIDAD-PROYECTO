# Frontend — React + Vite + Tailwind

Interfaz accesible para ingresar síntomas y ver resultados.

## Requisitos
- Node.js 18+

## Instalación y ejecución

```
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms eslint-plugin-jsx-a11y
npx tailwindcss init -p
# Configura los archivos generados siguiendo este repo base
npm run dev
```

Nota: ya incluimos archivos base de Tailwind y componentes, pero ejecuta los pasos para generar `package.json` si inicias desde cero.
