import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PokemonCard } from '../lib/pokemon-api';

export interface CartItem {
  card: PokemonCard;
  quantity: number;
  priceUsd: number;
  priceArs: number;
  inStock: boolean; // Track if item is in stock or needs to be ordered
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  total: {
    usd: number;
    ars: number;
  };
}

const initialState: CartState = {
  items: [],
  isOpen: false,
  total: {
    usd: 0,
    ars: 0,
  },
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'quantity'> & { quantity?: number }>) => {
      const { card, priceUsd, priceArs, inStock, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.card.id === card.id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          card,
          quantity,
          priceUsd,
          priceArs,
          inStock,
        });
      }

      // Recalculate totals
      state.total = state.items.reduce(
        (total, item) => ({
          usd: total.usd + (item.priceUsd * item.quantity),
          ars: total.ars + (item.priceArs * item.quantity),
        }),
        { usd: 0, ars: 0 }
      );
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      const cardId = action.payload;
      state.items = state.items.filter(item => item.card.id !== cardId);

      // Recalculate totals
      state.total = state.items.reduce(
        (total, item) => ({
          usd: total.usd + (item.priceUsd * item.quantity),
          ars: total.ars + (item.priceArs * item.quantity),
        }),
        { usd: 0, ars: 0 }
      );
    },

    updateQuantity: (state, action: PayloadAction<{ cardId: string; quantity: number }>) => {
      const { cardId, quantity } = action.payload;
      const item = state.items.find(item => item.card.id === cardId);

      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(item => item.card.id !== cardId);
        } else {
          item.quantity = quantity;
        }

        // Recalculate totals
        state.total = state.items.reduce(
          (total, item) => ({
            usd: total.usd + (item.priceUsd * item.quantity),
            ars: total.ars + (item.priceArs * item.quantity),
          }),
          { usd: 0, ars: 0 }
        );
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.total = { usd: 0, ars: 0 };
    },

    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },

    openCart: (state) => {
      state.isOpen = true;
    },

    closeCart: (state) => {
      state.isOpen = false;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCart,
  openCart,
  closeCart,
} = cartSlice.actions;

export default cartSlice.reducer;
