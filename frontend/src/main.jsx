import React from 'react'

import ReactDOM from 'react-dom/client'

import { BrowserRouter } from 'react-router-dom'

import App from './App'

import './index.css'

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

window.scrollTo(0, 0)

ReactDOM.createRoot(document.getElementById('root')).render(

  <React.StrictMode>

    <BrowserRouter basename="/viveros-frontend">

      <App />

    </BrowserRouter>

  </React.StrictMode>

)
