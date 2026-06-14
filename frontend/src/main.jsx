import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

// Fetch interceptor: redirects /api/* to Render backend in production
const apiUrl = import.meta.env.VITE_API_URL
if (apiUrl) {
  const _fetch = window.fetch
  window.fetch = function (url, options) {
    if (typeof url === 'string' && url.startsWith('/api')) {
      url = `${apiUrl}${url}`
    }
    return _fetch(url, options)
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)