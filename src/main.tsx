import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Render aplikasi tanpa StrictMode karena ada masalah kompatibilitas
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)
