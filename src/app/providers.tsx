'use client'

import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { Toaster } from 'react-hot-toast'
import { store, persistor } from '@/store'
import { useEffect } from 'react'
import { useAppDispatch } from '@/store'
import { fetchExchangeRate } from '@/store/currencySlice'

// Component to fetch exchange rate on mount
function CurrencyInitializer() {
  const dispatch = useAppDispatch()
  
  useEffect(() => {
    console.log('[CurrencyInitializer] Fetching exchange rate from backend...')
    dispatch(fetchExchangeRate())
  }, [dispatch])
  
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <CurrencyInitializer />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </PersistGate>
    </Provider>
  )
}
