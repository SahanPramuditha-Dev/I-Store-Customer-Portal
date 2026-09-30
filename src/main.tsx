import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// The receipt-bound Worker is the only supported customer verification flow.
const { default: App } = await import('./components/CloudPortal.tsx');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
