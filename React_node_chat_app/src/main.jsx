import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Toaster } from 'sonner'
import { SocketProvider } from './context/socketcontext'

createRoot(document.getElementById('root')).render(
  // <StrictMode>
  
  <SocketProvider>
    <App />
    <Toaster closeButton />
  </SocketProvider>

  // </StrictMode>,
)
