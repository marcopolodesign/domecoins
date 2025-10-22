/**
 * Round ARS price to a nice round number
 * Examples:
 * - 2355.43 → 2400
 * - 1234.56 → 1250
 * - 567.89 → 570
 * - 45.67 → 50
 */
export function roundToNiceNumber(price: number): number {
  if (price <= 0) return 0;
  
  // Determine rounding increment based on price range
  let roundTo: number;
  
  if (price >= 10000) {
    // For prices 10,000+, round to nearest 500
    roundTo = 500;
  } else if (price >= 1000) {
    // For prices 1,000-9,999, round to nearest 100
    roundTo = 100;
  } else if (price >= 100) {
    // For prices 100-999, round to nearest 10
    roundTo = 10;
  } else if (price >= 10) {
    // For prices 10-99, round to nearest 5
    roundTo = 5;
  } else {
    // For prices under 10, round to nearest 1
    roundTo = 1;
  }
  
  // Round up to the nearest increment
  return Math.ceil(price / roundTo) * roundTo;
}

/**
 * Format ARS price with proper locale formatting
 * @param price - Price in ARS (will be rounded)
 * @returns Formatted string like "AR$ 2.400"
 */
export function formatArsPrice(price: number): string {
  const rounded = roundToNiceNumber(price);
  return `AR$ ${rounded.toLocaleString('es-AR', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })}`;
}

/**
 * Get just the rounded number without formatting
 * @param price - Price in ARS
 * @returns Rounded price as number
 */
export function getRoundedArsPrice(price: number): number {
  return roundToNiceNumber(price);
}

