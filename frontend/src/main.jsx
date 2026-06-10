import React from 'react'

import ReactDOM from 'react-dom/client'

import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

import App from './App'

import './index.css'

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

window.scrollTo(0, 0)

registerSW({
  immediate: true
})

const splash = document.getElementById('boot-splash')
const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(

  <React.StrictMode>

    <BrowserRouter>

      <App />

    </BrowserRouter>

  </React.StrictMode>

)

window.requestAnimationFrame(() => {
  if (!splash) return
  splash.classList.add('boot-splash--hidden')
  window.setTimeout(() => splash.remove(), 320)
})
