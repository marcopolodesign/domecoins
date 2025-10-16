import axios from 'axios';

export interface ExchangeRates {
  usdToArs: number;
  dolarBlue: number;
  lastUpdated: string;
}

class CurrencyAPI {
  private cache: ExchangeRates | null = null;
  private cacheExpiry: Date | null = null;
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds only for testing custom prices

  private isValidCacheEntry(): boolean {
    return this.cache !== null && 
           this.cacheExpiry !== null && 
           new Date() < this.cacheExpiry;
  }

  async getDolarBlueRate(): Promise<number> {
    if (this.isValidCacheEntry()) {
      console.log('[CurrencyAPI] Using cached rate:', this.cache!.dolarBlue);
      return this.cache!.dolarBlue;
    }

    try {
      // First, try to get custom price or API rate from our backend
      console.log('[CurrencyAPI] Fetching rate from /api/currency...');
      const response = await axios.get('/api/currency');
      
      if (response.data) {
        const rate = response.data.blueRate || response.data.rate || response.data.dolarBlue;
        
        if (rate) {
          console.log('[CurrencyAPI] Got rate from backend:', rate, 'Source:', response.data.source || 'Unknown');
          
          this.cache = {
            usdToArs: rate,
            dolarBlue: rate,
            lastUpdated: new Date().toISOString()
          };
          this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION);
          
          return rate;
        }
      }
      
      // Fallback to multiple sources
      console.log('[CurrencyAPI] Backend failed, trying external sources...');
      const rate = await this.fetchFromMultipleSources();
      
      this.cache = {
        usdToArs: rate,
        dolarBlue: rate,
        lastUpdated: new Date().toISOString()
      };
      this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION);
      
      console.log('[CurrencyAPI] Got rate from external sources:', rate);
      return rate;
    } catch (error) {
      console.error('[CurrencyAPI] Error fetching dolar blue rate:', error);
      
      // Return cached value if available, otherwise fallback
      if (this.cache) {
        console.log('[CurrencyAPI] Using stale cache:', this.cache.dolarBlue);
        return this.cache.dolarBlue;
      }
      
      // Fallback rate if all else fails
      console.log('[CurrencyAPI] Using fallback rate: 1335');
      return 1335; // Default rate as mentioned in requirements
    }
  }

  private async fetchFromMultipleSources(): Promise<number> {
    const sources = [
      this.fetchFromDolarApi,
      this.fetchFromDolarhoy,
      this.fetchFromDolarito,
      this.fetchFromAmbito
    ];

    for (const source of sources) {
      try {
        const rate = await source.call(this);
        if (rate && rate > 0) {
          return rate;
        }
      } catch (error) {
        console.warn('Failed to fetch from source:', error);
        continue;
      }
    }

    throw new Error('All currency sources failed');
  }

  // Primary source: DolarApi (public API)
  private async fetchFromDolarApi(): Promise<number> {
    try {
      const response = await axios.get('https://dolarapi.com/v1/dolares/blue', {
        timeout: 5000
      });
      
      if (response.data && response.data.venta) {
        return parseFloat(response.data.venta);
      }
      
      throw new Error('Invalid response from DolarApi');
    } catch (error) {
      throw new Error('DolarApi fetch failed');
    }
  }

  // Fallback: Scrape dolarhoy.com
  private async fetchFromDolarhoy(): Promise<number> {
    try {
      // Note: This would require a backend proxy to avoid CORS
      // For now, we'll skip this implementation
      throw new Error('Dolarhoy scraping not implemented');
    } catch (error) {
      throw new Error('Dolarhoy fetch failed');
    }
  }

  // Fallback: Scrape dolarito.ar
  private async fetchFromDolarito(): Promise<number> {
    try {
      // Note: This would require a backend proxy to avoid CORS
      // For now, we'll skip this implementation
      throw new Error('Dolarito scraping not implemented');
    } catch (error) {
      throw new Error('Dolarito fetch failed');
    }
  }

  // Fallback: Ambito.com API
  private async fetchFromAmbito(): Promise<number> {
    try {
      const response = await axios.get('https://mercados.ambito.com//dolar/informal/variacion', {
        timeout: 5000
      });
      
      if (response.data && response.data.venta) {
        return parseFloat(response.data.venta);
      }
      
      throw new Error('Invalid response from Ambito');
    } catch (error) {
      throw new Error('Ambito fetch failed');
    }
  }

  convertUsdToArs(usdAmount: number): Promise<number> {
    return this.getDolarBlueRate().then(rate => usdAmount * rate);
  }

  async formatPrice(usdPrice: number): Promise<{
    usd: string;
    ars: string;
    rate: number;
  }> {
    const rate = await this.getDolarBlueRate();
    const arsPrice = usdPrice * rate;
    
    return {
      usd: `US$${usdPrice.toFixed(2)}`,
      ars: `AR$${arsPrice.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      rate
    };
  }

  // For testing/development - manually set rate
  setTestRate(rate: number): void {
    this.cache = {
      usdToArs: rate,
      dolarBlue: rate,
      lastUpdated: new Date().toISOString()
    };
    this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION);
  }

  getCurrentRate(): number | null {
    return this.cache?.dolarBlue || null;
  }

  getLastUpdated(): string | null {
    return this.cache?.lastUpdated || null;
  }
}

export const currencyAPI = new CurrencyAPI();
export default CurrencyAPI;
