/**
 * Pokemon TCG Type Gradients
 * Returns a CSS linear-gradient string based on the Pokemon's energy type
 */

export const TYPE_GRADIENTS: Record<string, string> = {
  Fire: 'linear-gradient(137deg, #F5E56D -14.28%, #FFB798 40.4%, #E11B1B 97.8%)',
  Water: 'linear-gradient(137deg, #6DF5D7 -14.28%, #7596F8 70.2%, #1B36E1 112.6%)',
  Grass: 'linear-gradient(137deg, #E2FFC8 -14.28%, #75F887 56.38%, #035425 112.6%)',
  Lightning: 'linear-gradient(137deg, #F5E76D -14.28%, #E6F875 70.2%, #6AE11B 112.6%)',
  Psychic: 'linear-gradient(137deg, #C16DF5 -14.28%, #A5F875 70.2%, #8E00CB 108.04%)',
  Fighting: 'linear-gradient(137deg, #CB8E00 -14.28%, #F8E075 70.2%, #E11B1F 112.6%)',
  Darkness: 'linear-gradient(137deg, #939393 -14.28%, #494949 70.2%, #000 112.6%)',
  Metal: 'linear-gradient(137deg, #E2E2E2 -14.28%, #909090 70.2%, #000 112.6%)',
  Fairy: 'linear-gradient(137deg, #FFD6F5 -14.28%, #F8A5E3 70.2%, #E11B9E 112.6%)',
  Dragon: 'linear-gradient(137deg, #FFD76D -14.28%, #9D75F8 70.2%, #4A1BE1 112.6%)',
  Colorless: 'linear-gradient(137deg, #F5F5F5 -14.28%, #D1D5DB 70.2%, #9CA3AF 112.6%)',
};

/**
 * Get gradient for a Pokemon's energy type
 * @param energyType - Array of energy types (uses first one)
 * @returns CSS gradient string or default colorless gradient
 */
export function getTypeGradient(energyType?: string[]): string {
  if (!energyType || energyType.length === 0) {
    return TYPE_GRADIENTS.Colorless;
  }
  
  const primaryType = energyType[0];
  return TYPE_GRADIENTS[primaryType] || TYPE_GRADIENTS.Colorless;
}

/**
 * Get all available type names
 */
export function getAllTypes(): string[] {
  return Object.keys(TYPE_GRADIENTS);
}

