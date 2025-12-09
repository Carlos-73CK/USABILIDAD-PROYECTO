import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import { App } from './ui/App'

const container = document.getElementById('root') as HTMLElement
ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
