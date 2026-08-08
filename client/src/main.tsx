import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { trpc, trpcClient } from '@/api/trpc'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <I18nextProvider i18n={i18n}>
            <App />
          </I18nextProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
)
