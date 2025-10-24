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
      // ALWAYS get rate from our backend (includes admin custom price)
      console.log('[CurrencyAPI] Fetching rate from /api/currency...');
      const response = await axios.get('/api/currency');
      
      if (response.data) {
        const rate = response.data.blueRate || response.data.rate || response.data.dolarBlue;
        
        if (rate && rate > 0) {
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
      
      throw new Error('Backend returned invalid rate');
    } catch (error) {
      console.error('[CurrencyAPI] Error fetching dolar blue rate from backend:', error);
      
      // Return cached value if available
      if (this.cache) {
        console.log('[CurrencyAPI] Using stale cache:', this.cache.dolarBlue);
        return this.cache.dolarBlue;
      }
      
      // If no cache, throw error - we MUST have a backend rate
      throw new Error('Failed to fetch dollar rate from backend and no cache available');
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
