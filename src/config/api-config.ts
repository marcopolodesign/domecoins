// API Configuration
export type APIProvider = 'pokemon-tcg' | 'precios-tcg' | 'auto';

export interface APIConfig {
  provider: APIProvider;
  fallbackEnabled: boolean;
  rateLimitRetries: number;
  timeout: number;
}

// Default configuration
export const defaultAPIConfig: APIConfig = {
  provider: 'auto', // 'auto' will try both APIs and use the best one
  fallbackEnabled: true,
  rateLimitRetries: 3,
  timeout: 10000, // 10 seconds
};

// Environment-based configuration
export const getAPIConfig = (): APIConfig => {
  // You can change this to 'pokemon-tcg', 'precios-tcg', or 'auto'
  const provider = (process.env.NEXT_PUBLIC_API_PROVIDER as APIProvider) || 'auto';
  
  return {
    ...defaultAPIConfig,
    provider,
  };
};

// Runtime configuration (can be changed during runtime)
let runtimeConfig: APIConfig = defaultAPIConfig;

export const setAPIConfig = (config: Partial<APIConfig>) => {
  runtimeConfig = { ...runtimeConfig, ...config };
};

export const getCurrentAPIConfig = (): APIConfig => {
  return runtimeConfig;
};
