import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { currencyAPI } from '../lib/currency-api';

interface CurrencyState {
  dolarBlueRate: number;
  lastUpdated: Date | null;
  loading: boolean;
  error: string | null;
}

const initialState: CurrencyState = {
  dolarBlueRate: 1335, // Default rate
  lastUpdated: null,
  loading: false,
  error: null,
};

// Async thunk to fetch exchange rate
export const fetchExchangeRate = createAsyncThunk(
  'currency/fetchExchangeRate',
  async () => {
    const rate = await currencyAPI.getDolarBlueRate();
    return {
      rate,
      lastUpdated: new Date(),
    };
  }
);

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setRate: (state, action: PayloadAction<number>) => {
      state.dolarBlueRate = action.payload;
      state.lastUpdated = new Date();
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExchangeRate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExchangeRate.fulfilled, (state, action) => {
        state.loading = false;
        state.dolarBlueRate = action.payload.rate;
        state.lastUpdated = action.payload.lastUpdated;
      })
      .addCase(fetchExchangeRate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch exchange rate';
      });
  },
});

export const { setRate, clearError } = currencySlice.actions;
export default currencySlice.reducer;
