import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import cartReducer from './cartSlice';
import productsReducer from './productsSlice';
import currencyReducer from './currencySlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['cart'], // Only persist cart state
};

const rootReducer = combineReducers({
  cart: cartReducer,
  products: productsReducer,
  currency: currencyReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
