import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GeoChain from './GeoChain.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GeoChain />
  </StrictMode>
)
