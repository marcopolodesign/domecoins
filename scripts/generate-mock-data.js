#!/usr/bin/env node

/**
 * Generate mock Pokemon card data for testing when API is unavailable
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'pokemon-tcg');

// Popular Pokemon for realistic mock data
const POKEMON_NAMES = [
  'Pikachu', 'Charizard', 'Mewtwo', 'Blastoise', 'Venusaur', 'Gengar', 'Dragonite',
  'Mew', 'Eevee', 'Snorlax', 'Gyarados', 'Alakazam', 'Machamp', 'Arcanine', 'Lapras',
  'Articuno', 'Zapdos', 'Moltres', 'Jolteon', 'Flareon', 'Vaporeon', 'Umbreon', 'Espeon',
  'Lugia', 'Ho-Oh', 'Celebi', 'Rayquaza', 'Kyogre', 'Groudon', 'Deoxys', 'Lucario',
  'Garchomp', 'Dialga', 'Palkia', 'Giratina', 'Darkrai', 'Shaymin', 'Arceus',
  'Reshiram', 'Zekrom', 'Kyurem', 'Genesect', 'Greninja', 'Xerneas', 'Yveltal',
  'Zygarde', 'Solgaleo', 'Lunala', 'Necrozma', 'Zeraora', 'Zacian', 'Zamazenta',
  'Eternatus', 'Calyrex', 'Koraidon', 'Miraidon', 'Meowscarada', 'Skeledirge', 'Quaquaval'
];

const TYPES = ['Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Dragon', 'Fairy', 'Colorless'];
const RARITIES = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Rare Ultra', 'Rare Secret'];
const SUPERTYPES = ['Pokémon', 'Trainer', 'Energy'];

function generateCard(setId, setName, cardNumber, totalCards) {
  const pokemonName = POKEMON_NAMES[Math.floor(Math.random() * POKEMON_NAMES.length)];
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  const rarity = RARITIES[Math.floor(Math.random() * RARITIES.length)];
  const hp = (Math.floor(Math.random() * 15) + 5) * 10; // 50-200 HP
  const cardId = `${setId}-${cardNumber}`;
  
  const isTrainer = Math.random() > 0.8;
  const supertype = isTrainer ? 'Trainer' : 'Pokémon';
  
  return {
    id: cardId,
    name: isTrainer ? `${pokemonName} Supporter` : pokemonName,
    supertype,
    subtypes: isTrainer ? ['Supporter'] : ['Basic'],
    hp: isTrainer ? undefined : `${hp}`,
    types: isTrainer ? undefined : [type],
    attacks: isTrainer ? undefined : [
      {
        name: 'Quick Attack',
        cost: [type, 'Colorless'],
        convertedEnergyCost: 2,
        damage: `${Math.floor(Math.random() * 50) + 30}`,
        text: 'Flip a coin. If heads, this attack does 20 more damage.'
      }
    ],
    weaknesses: isTrainer ? undefined : [
      {
        type: TYPES[Math.floor(Math.random() * TYPES.length)],
        value: '×2'
      }
    ],
    resistances: [],
    retreatCost: isTrainer ? undefined : ['Colorless'],
    convertedRetreatCost: isTrainer ? undefined : 1,
    set: {
      id: setId,
      name: setName,
      series: 'Sword & Shield',
      printedTotal: totalCards,
      total: totalCards,
      legalities: {
        unlimited: 'Legal',
        standard: 'Legal'
      },
      ptcgoCode: setId.toUpperCase(),
      releaseDate: '2023/01/01',
      updatedAt: '2024/01/01 12:00:00',
      images: {
        symbol: `https://images.pokemontcg.io/${setId}/symbol.png`,
        logo: `https://images.pokemontcg.io/${setId}/logo.png`
      }
    },
    number: `${cardNumber}`,
    artist: 'Various',
    rarity,
    nationalPokedexNumbers: isTrainer ? [] : [Math.floor(Math.random() * 898) + 1],
    images: {
      small: `https://images.pokemontcg.io/${setId}/${cardNumber}.png`,
      large: `https://images.pokemontcg.io/${setId}/${cardNumber}_hires.png`
    },
    tcgplayer: {
      url: `https://prices.pokemontcg.io/tcgplayer/${cardId}`,
      updatedAt: '2024/01/01',
      prices: {
        normal: {
          low: Math.floor(Math.random() * 5) + 1,
          mid: Math.floor(Math.random() * 10) + 5,
          high: Math.floor(Math.random() * 20) + 10,
          market: Math.floor(Math.random() * 15) + 5
        }
      }
    }
  };
}

function generateSet(setId, setName, totalCards) {
  console.log(`\n📦 Generating ${setName} (${setId}) - ${totalCards} cards...`);
  
  const cards = [];
  for (let i = 1; i <= totalCards; i++) {
    cards.push(generateCard(setId, setName, i, totalCards));
  }
  
  const filename = `${setId}-full.json`;
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(cards, null, 2));
  
  const filesize = (fs.statSync(filepath).size / 1024).toFixed(1);
  console.log(`✅ Generated ${filename} (${filesize}KB)`);
  
  return cards.length;
}

// Sets to generate
const SETS = [
  { id: 'sv3pt5', name: 'Scarlet & Violet 151', total: 207 },
  { id: 'cel25', name: 'Celebrations', total: 50 },
  { id: 'sv9pt5', name: 'Destined Rivals', total: 94 }
];

console.log('🎲 Generating Mock Pokemon Card Data');
console.log('=====================================');
console.log(`📁 Output directory: ${DATA_DIR}\n`);

// Create directory if needed
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let totalGenerated = 0;

SETS.forEach(set => {
  totalGenerated += generateSet(set.id, set.name, set.total);
});

console.log('\n=====================================');
console.log(`✨ Generated ${totalGenerated} mock cards across ${SETS.length} sets`);
console.log('\n💡 Note: This is MOCK DATA for testing purposes.');
console.log('   Real card images and data may differ.');
console.log('\n   To get real data:');
console.log('   1. Try from a different network');
console.log('   2. Use a VPN');
console.log('   3. Download manually via browser\n');

