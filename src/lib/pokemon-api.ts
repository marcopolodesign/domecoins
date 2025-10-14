import axios from 'axios';

const POKEMON_TCG_API_BASE = 'https://api.pokemontcg.io/v2';

export interface PokemonCard {
  id: string;
  name: string;
  images: {
    small: string;
    large: string;
  };
  cardmarket?: {
    prices?: {
      averageSellPrice?: number;
      lowPrice?: number;
      trendPrice?: number;
    };
  };
  tcgplayer?: {
    prices?: {
      holofoil?: {
        low?: number;
        mid?: number;
        high?: number;
        market?: number;
      };
      normal?: {
        low?: number;
        mid?: number;
        high?: number;
        market?: number;
      };
    };
  };
  set: {
    id: string;
    name: string;
    series: string;
    releaseDate: string;
  };
  number: string;
  rarity?: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  attacks?: Array<{
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage: string;
    text: string;
  }>;
  weaknesses?: Array<{
    type: string;
    value: string;
  }>;
  resistances?: Array<{
    type: string;
    value: string;
  }>;
  retreatCost?: string[];
  convertedRetreatCost?: number;
  flavorText?: string;
}

export interface PokemonSet {
  id: string;
  name: string;
  series: string;
  total: number;
  releaseDate: string;
  images: {
    symbol: string;
    logo: string;
  };
}

export interface SearchFilters {
  name?: string;
  set?: string;
  types?: string[];
  supertype?: string;
  subtypes?: string[];
  rarity?: string;
  hp?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
}

class PokemonTCGAPI {
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  private getHeaders() {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey;
    }
    
    return headers;
  }

  async searchCards(filters: SearchFilters = {}): Promise<{
    data: PokemonCard[];
    page: number;
    pageSize: number;
    count: number;
    totalCount: number;
  }> {
    try {
      const params = new URLSearchParams();
      
      // Build query string
      const queryParts: string[] = [];
      
      if (filters.name) {
        queryParts.push(`name:"${filters.name}*"`);
      }
      
      if (filters.set) {
        queryParts.push(`set.id:"${filters.set}"`);
      }
      
      if (filters.types && filters.types.length > 0) {
        queryParts.push(`types:"${filters.types.join('" OR types:"')}"`);
      }
      
      if (filters.supertype) {
        queryParts.push(`supertype:"${filters.supertype}"`);
      }
      
      if (filters.subtypes && filters.subtypes.length > 0) {
        queryParts.push(`subtypes:"${filters.subtypes.join('" OR subtypes:"')}"`);
      }
      
      if (filters.rarity) {
        queryParts.push(`rarity:"${filters.rarity}"`);
      }
      
      if (filters.hp) {
        queryParts.push(`hp:"${filters.hp}"`);
      }
      
      if (queryParts.length > 0) {
        params.append('q', queryParts.join(' AND '));
      }
      
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      
      if (filters.pageSize) {
        params.append('pageSize', filters.pageSize.toString());
      } else {
        params.append('pageSize', '20');
      }
      
      if (filters.orderBy) {
        params.append('orderBy', filters.orderBy);
      } else {
        params.append('orderBy', 'name');
      }

      const response = await axios.get(`${POKEMON_TCG_API_BASE}/cards?${params.toString()}`, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching Pokemon cards:', error);
      throw new Error('Failed to fetch Pokemon cards');
    }
  }

  async getCardById(id: string): Promise<PokemonCard> {
    try {
      const response = await axios.get(`${POKEMON_TCG_API_BASE}/cards/${id}`, {
        headers: this.getHeaders(),
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching Pokemon card:', error);
      throw new Error('Failed to fetch Pokemon card');
    }
  }

  async getSets(): Promise<PokemonSet[]> {
    try {
      const response = await axios.get(`${POKEMON_TCG_API_BASE}/sets`, {
        headers: this.getHeaders(),
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching Pokemon sets:', error);
      throw new Error('Failed to fetch Pokemon sets');
    }
  }

  // Get price for a card (prefer TCGPlayer, fallback to Cardmarket)
  getCardPrice(card: PokemonCard): number | null {
    // Try TCGPlayer prices first
    if (card.tcgplayer?.prices) {
      const prices = card.tcgplayer.prices;
      
      // Prefer holofoil market price, then normal market price
      if (prices.holofoil?.market) {
        return prices.holofoil.market;
      }
      if (prices.normal?.market) {
        return prices.normal.market;
      }
      
      // Fallback to mid prices
      if (prices.holofoil?.mid) {
        return prices.holofoil.mid;
      }
      if (prices.normal?.mid) {
        return prices.normal.mid;
      }
    }
    
    // Try Cardmarket prices as fallback
    if (card.cardmarket?.prices) {
      const prices = card.cardmarket.prices;
      
      if (prices.averageSellPrice) {
        return prices.averageSellPrice;
      }
      if (prices.trendPrice) {
        return prices.trendPrice;
      }
      if (prices.lowPrice) {
        return prices.lowPrice;
      }
    }
    
    return null;
  }
}

export const pokemonAPI = new PokemonTCGAPI(process.env.NEXT_PUBLIC_POKEMON_API_KEY);
export default PokemonTCGAPI;
