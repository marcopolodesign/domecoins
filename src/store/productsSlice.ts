import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Unified card interface that works with both APIs
interface Card {
  id: string;
  name: string;
  detailUrl: string;
  imageUrl: string;
  categoryName: string;
  offers: string[];
  outOfStockPrice?: string;
  provider: string;
  rarity?: string;
  setId?: string;
  cardId?: string;
  types?: string[];
  weaknesses?: any[];
  resistances?: any[];
  attacks?: any[];
  hp?: string | number;
  nationalPokedexNumbers?: number[];
}

interface Set {
  id: string;
  name: string;
  releaseDate?: string;
}

interface SearchFilters {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  name?: string;
  set?: string;
  types?: string[];
  rarity?: string;
}

interface ProductsState {
  cards: Card[];
  sets: Set[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    count: number;
  };
  currentAPI: string;
}

const initialState: ProductsState = {
  cards: [],
  sets: [],
  loading: false,
  error: null,
  filters: {
    page: 1,
    pageSize: 20,
    orderBy: 'name',
  },
  pagination: {
    page: 1,
    pageSize: 20,
    totalCount: 0,
    count: 0,
  },
  currentAPI: 'auto',
};

// Async thunks
export const fetchCards = createAsyncThunk(
  'products/fetchCards',
  async (params: { filters: SearchFilters; apiProvider?: string } = { filters: {}, apiProvider: 'auto' }) => {
    const { filters, apiProvider } = params;
    
    const searchParams = new URLSearchParams();
    if (filters.name) searchParams.set('query', filters.name);
    if (apiProvider) searchParams.set('provider', apiProvider);
    if (filters.page) searchParams.set('page', filters.page.toString());
    if (filters.pageSize) searchParams.set('pageSize', filters.pageSize.toString());
    if (filters.orderBy) searchParams.set('orderBy', filters.orderBy);
    if (filters.set) searchParams.set('set', filters.set);
    if (filters.types && filters.types.length > 0) searchParams.set('types', filters.types.join(','));
    if (filters.rarity) searchParams.set('rarity', filters.rarity);

    const response = await fetch(`/api/search?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return { ...data, apiProvider: apiProvider || 'auto' };
  }
);

export const fetchSets = createAsyncThunk(
  'products/fetchSets',
  async () => {
    // For now, return a static list of sets. You can expand this later
    return [
      { id: 'base1', name: 'Base Set' },
      { id: 'base2', name: 'Jungle' },
      { id: 'base3', name: 'Fossil' },
      { id: 'base4', name: 'Base Set 2' },
      { id: 'gym1', name: 'Gym Heroes' },
      { id: 'gym2', name: 'Gym Challenge' },
      { id: 'neo1', name: 'Neo Genesis' },
      { id: 'neo2', name: 'Neo Discovery' },
      { id: 'neo3', name: 'Neo Revelation' },
      { id: 'neo4', name: 'Neo Destiny' },
      { id: 'ex1', name: 'Ruby & Sapphire' },
      { id: 'ex2', name: 'Sandstorm' },
      { id: 'ex3', name: 'Dragon' },
      { id: 'ex4', name: 'Team Magma vs Team Aqua' },
      { id: 'ex5', name: 'Hidden Legends' },
      { id: 'ex6', name: 'FireRed & LeafGreen' },
      { id: 'ex7', name: 'Team Rocket Returns' },
      { id: 'ex8', name: 'Deoxys' },
      { id: 'ex9', name: 'Emerald' },
      { id: 'ex10', name: 'Unseen Forces' },
      { id: 'ex11', name: 'Delta Species' },
      { id: 'ex12', name: 'Legend Maker' },
      { id: 'ex13', name: 'Holon Phantoms' },
      { id: 'ex14', name: 'Crystal Guardians' },
      { id: 'ex15', name: 'Dragon Frontiers' },
      { id: 'ex16', name: 'Power Keepers' },
      { id: 'dp1', name: 'Diamond & Pearl' },
      { id: 'dp2', name: 'Mysterious Treasures' },
      { id: 'dp3', name: 'Secret Wonders' },
      { id: 'dp4', name: 'Great Encounters' },
      { id: 'dp5', name: 'Majestic Dawn' },
      { id: 'dp6', name: 'Legends Awakened' },
      { id: 'dp7', name: 'Stormfront' },
      { id: 'pl1', name: 'Platinum' },
      { id: 'pl2', name: 'Rising Rivals' },
      { id: 'pl3', name: 'Supreme Victors' },
      { id: 'pl4', name: 'Arceus' },
      { id: 'hgss1', name: 'HeartGold & SoulSilver' },
      { id: 'hgss2', name: 'Unleashed' },
      { id: 'hgss3', name: 'Undaunted' },
      { id: 'hgss4', name: 'Triumphant' },
      { id: 'col1', name: 'Call of Legends' },
      { id: 'bw1', name: 'Black & White' },
      { id: 'bw2', name: 'Emerging Powers' },
      { id: 'bw3', name: 'Noble Victories' },
      { id: 'bw4', name: 'Next Destinies' },
      { id: 'bw5', name: 'Dark Explorers' },
      { id: 'bw6', name: 'Dragons Exalted' },
      { id: 'bw7', name: 'Boundaries Crossed' },
      { id: 'bw8', name: 'Plasma Storm' },
      { id: 'bw9', name: 'Plasma Freeze' },
      { id: 'bw10', name: 'Plasma Blast' },
      { id: 'bw11', name: 'Legendary Treasures' },
      { id: 'xy1', name: 'XY' },
      { id: 'xy2', name: 'Flashfire' },
      { id: 'xy3', name: 'Furious Fists' },
      { id: 'xy4', name: 'Phantom Forces' },
      { id: 'xy5', name: 'Primal Clash' },
      { id: 'xy6', name: 'Roaring Skies' },
      { id: 'xy7', name: 'Ancient Origins' },
      { id: 'xy8', name: 'BREAKthrough' },
      { id: 'xy9', name: 'BREAKpoint' },
      { id: 'xy10', name: 'Fates Collide' },
      { id: 'xy11', name: 'Steam Siege' },
      { id: 'xy12', name: 'Evolutions' },
      { id: 'sm1', name: 'Sun & Moon' },
      { id: 'sm2', name: 'Guardians Rising' },
      { id: 'sm3', name: 'Burning Shadows' },
      { id: 'sm4', name: 'Crimson Invasion' },
      { id: 'sm5', name: 'Ultra Prism' },
      { id: 'sm6', name: 'Forbidden Light' },
      { id: 'sm7', name: 'Celestial Storm' },
      { id: 'sm8', name: 'Lost Thunder' },
      { id: 'sm9', name: 'Team Up' },
      { id: 'sm10', name: 'Detective Pikachu' },
      { id: 'sm11', name: 'Unbroken Bonds' },
      { id: 'sm12', name: 'Unified Minds' },
      { id: 'sm115', name: 'Hidden Fates' },
      { id: 'sm116', name: 'Cosmic Eclipse' },
      { id: 'swsh1', name: 'Sword & Shield' },
      { id: 'swsh2', name: 'Rebel Clash' },
      { id: 'swsh3', name: 'Darkness Ablaze' },
      { id: 'swsh35', name: 'Champion\'s Path' },
      { id: 'swsh4', name: 'Vivid Voltage' },
      { id: 'swsh45', name: 'Shining Fates' },
      { id: 'swsh5', name: 'Battle Styles' },
      { id: 'swsh6', name: 'Chilling Reign' },
      { id: 'swsh7', name: 'Evolving Skies' },
      { id: 'swsh8', name: 'Celebrations' },
      { id: 'swsh9', name: 'Fusion Strike' },
      { id: 'swsh10', name: 'Brilliant Stars' },
      { id: 'swsh11', name: 'Astral Radiance' },
      { id: 'swsh12', name: 'Lost Origin' },
      { id: 'swsh12pt5', name: 'Silver Tempest' },
      { id: 'swshp', name: 'SWSH Black Star Promos' },
      { id: 'swshp_SWSH', name: 'SWSH Black Star Promos' },
      { id: 'swshp_SM', name: 'SM Black Star Promos' },
      { id: 'swshp_XY', name: 'XY Black Star Promos' },
      { id: 'swshp_BW', name: 'BW Black Star Promos' },
      { id: 'swshp_DP', name: 'DP Black Star Promos' },
      { id: 'swshp_EX', name: 'EX Black Star Promos' },
      { id: 'swshp_NEO', name: 'Neo Black Star Promos' },
      { id: 'swshp_GYM', name: 'Gym Black Star Promos' },
      { id: 'swshp_BASE', name: 'Base Black Star Promos' },
      { id: 'sv1', name: 'Scarlet & Violet' },
      { id: 'sv2', name: 'Paldea Evolved' },
      { id: 'sv3', name: 'Obsidian Flames' },
      { id: 'sv3pt5', name: '151' },
      { id: 'sv4', name: 'Paradox Rift' },
      { id: 'sv4pt5', name: 'Paldean Fates' },
      { id: 'sv5', name: 'Temporal Forces' },
      { id: 'sv6', name: 'Twilight Masquerade' },
      { id: 'sv7', name: 'Shrouded Fable' },
      { id: 'sv8', name: 'Ancient Roar' },
      { id: 'sv9', name: 'Future Flash' },
      { id: 'sv10', name: 'Cyber Judge' },
      { id: 'sv11', name: 'Stellar Crown' }
    ];
  }
);

export const fetchCardById = createAsyncThunk(
  'products/fetchCardById',
  async (params: { id: string; apiProvider?: string } = { id: '', apiProvider: 'auto' }) => {
    const { id, apiProvider } = params;
    
    const searchParams = new URLSearchParams();
    searchParams.set('query', id);
    if (apiProvider) searchParams.set('provider', apiProvider);
    
    const response = await fetch(`/api/search?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    // Return the first card that matches the ID
    const card = data.items.find((item: Card) => item.id === id || item.cardId === id);
    if (!card) {
      throw new Error('Card not found');
    }
    return card;
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    clearFilters: (state) => {
      state.filters = {
        page: 1,
        pageSize: 20,
        orderBy: 'name',
      };
    },
    
    setPage: (state, action: PayloadAction<number>) => {
      state.filters.page = action.payload;
      state.pagination.page = action.payload;
    },
    
    setPageSize: (state, action: PayloadAction<number>) => {
      state.filters.pageSize = action.payload;
      state.pagination.pageSize = action.payload;
      state.filters.page = 1; // Reset to first page when changing page size
      state.pagination.page = 1;
    },

    setAPIProvider: (state, action: PayloadAction<string>) => {
      state.currentAPI = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cards
      .addCase(fetchCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCards.fulfilled, (state, action) => {
        state.loading = false;
        state.cards = action.payload.items || action.payload.data || [];
        state.pagination = {
          page: action.payload.page || 1,
          pageSize: action.payload.pageSize || 20,
          count: action.payload.count || action.payload.items?.length || 0,
          totalCount: action.payload.totalCount || action.payload.items?.length || 0,
        };
        state.currentAPI = action.payload.apiProvider || 'auto';
      })
      .addCase(fetchCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch cards';
      })
      
      // Fetch sets
      .addCase(fetchSets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSets.fulfilled, (state, action) => {
        state.loading = false;
        state.sets = action.payload;
      })
      .addCase(fetchSets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sets';
      })
      
      // Fetch card by ID
      .addCase(fetchCardById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCardById.fulfilled, (state, action) => {
        state.loading = false;
        // Update card in the cards array if it exists, or add it
        const existingIndex = state.cards.findIndex(card => card.id === action.payload.id);
        if (existingIndex >= 0) {
          state.cards[existingIndex] = action.payload;
        } else {
          state.cards.unshift(action.payload);
        }
      })
      .addCase(fetchCardById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch card';
      });
  },
});

export const { setFilters, clearFilters, setPage, setPageSize, setAPIProvider } = productsSlice.actions;
export default productsSlice.reducer;
