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

// Load cart from localStorage (client-side only)
const loadCartFromStorage = (): CartState => {
  if (typeof window === 'undefined') {
    return {
      items: [],
      isOpen: false,
      total: { usd: 0, ars: 0 },
    };
  }

  try {
    const savedCart = localStorage.getItem('pokemon-cart');
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      console.log('[CartSlice] Loaded cart from localStorage:', parsed.items.length, 'items');
      return parsed;
    }
  } catch (error) {
    console.error('[CartSlice] Error loading cart from localStorage:', error);
  }

  return {
    items: [],
    isOpen: false,
    total: { usd: 0, ars: 0 },
  };
};

// Save cart to localStorage
const saveCartToStorage = (state: CartState) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('pokemon-cart', JSON.stringify(state));
    console.log('[CartSlice] Saved cart to localStorage:', state.items.length, 'items');
  } catch (error) {
    console.error('[CartSlice] Error saving cart to localStorage:', error);
  }
};

const initialState: CartState = loadCartFromStorage();

// Maximum quantity per variant (printing)
const MAX_QUANTITY_PER_VARIANT = 3;

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'quantity'> & { quantity?: number }>) => {
      const { card, priceUsd, priceArs, inStock, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.card.id === card.id);

      if (existingItem) {
        // Check if adding would exceed the limit
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > MAX_QUANTITY_PER_VARIANT) {
          // Cap at maximum
          existingItem.quantity = MAX_QUANTITY_PER_VARIANT;
          console.warn(`Cannot add more than ${MAX_QUANTITY_PER_VARIANT} of the same variant`);
        } else {
          existingItem.quantity = newQuantity;
        }
      } else {
        // New item - cap initial quantity at max
        const cappedQuantity = Math.min(quantity, MAX_QUANTITY_PER_VARIANT);
        state.items.push({
          card,
          quantity: cappedQuantity,
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
      
      // Save to localStorage
      saveCartToStorage(state);
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
      
      // Save to localStorage
      saveCartToStorage(state);
    },

    updateQuantity: (state, action: PayloadAction<{ cardId: string; quantity: number }>) => {
      const { cardId, quantity } = action.payload;
      const item = state.items.find(item => item.card.id === cardId);

      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(item => item.card.id !== cardId);
        } else {
          // Cap quantity at maximum
          item.quantity = Math.min(quantity, MAX_QUANTITY_PER_VARIANT);
        }

        // Recalculate totals
        state.total = state.items.reduce(
          (total, item) => ({
            usd: total.usd + (item.priceUsd * item.quantity),
            ars: total.ars + (item.priceArs * item.quantity),
          }),
          { usd: 0, ars: 0 }
        );
        
        // Save to localStorage
        saveCartToStorage(state);
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.total = { usd: 0, ars: 0 };
      
      // Save to localStorage
      saveCartToStorage(state);
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

// Export the maximum quantity constant
export { MAX_QUANTITY_PER_VARIANT };

export default cartSlice.reducer;
