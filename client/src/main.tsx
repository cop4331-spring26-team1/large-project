import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// --app-height tracks the real visible viewport height on iOS (keyboard-aware)
const setAppHeight = () => {
  const h = window.visualViewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--app-height', `${h}px`)
}
window.visualViewport?.addEventListener('resize', setAppHeight)
window.addEventListener('resize', setAppHeight)
setAppHeight()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
