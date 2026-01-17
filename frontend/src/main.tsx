import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startOvershootLoop } from './overshootWorker'

// Start Overshoot loop after a short delay to ensure app is mounted
setTimeout(() => {
  startOvershootLoop();
}, 2000);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
