#!/usr/bin/env node

/**
 * Pokémon TCG Data Sync Script
 * 
 * This script downloads all cards and sets from the Pokémon TCG API
 * and saves them to local JSON files for offline use.
 * 
 * Usage:
 *   node scripts/sync-pokemon-data.js
 * 
 * Environment Variables:
 *   POKEMON_TCG_API_KEY - Your API key from https://dev.pokemontcg.io/
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'https://api.pokemontcg.io/v2';
const DATA_DIR = path.join(__dirname, '..', 'data', 'pokemon-tcg');
const API_KEY = process.env.POKEMON_TCG_API_KEY;

// Rate limiting: 20,000 requests/day with API key = ~13 requests/minute to be safe
const DELAY_BETWEEN_REQUESTS = 3000; // 3 seconds between requests (increased if timeouts occur)

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Make a request to the Pokémon TCG API with retry logic
 */
async function fetchWithRetry(url, retries = 3) {
  const headers = {
    'Accept': 'application/json',
  };
  
  if (API_KEY) {
    headers['X-Api-Key'] = API_KEY;
  } else {
    console.warn('⚠️  No API key found. Rate limits will be restrictive (1,000/day).');
    console.warn('   Get one at: https://dev.pokemontcg.io/');
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { headers });
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        console.log(`⏸️  Rate limited. Waiting ${retryAfter} seconds...`);
        await sleep(retryAfter * 1000);
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      await sleep(5000);
    }
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch all sets
 */
async function fetchAllSets() {
  console.log('📦 Fetching all sets...');
  const data = await fetchWithRetry(`${API_BASE_URL}/sets`);
  
  const sets = data.data || [];
  console.log(`✅ Found ${sets.length} sets`);
  
  // Save sets to file
  const setsFile = path.join(DATA_DIR, 'sets.json');
  fs.writeFileSync(setsFile, JSON.stringify(sets, null, 2));
  console.log(`💾 Saved to ${setsFile}`);
  
  return sets;
}

/**
 * Fetch all cards (paginated)
 */
async function fetchAllCards() {
  console.log('\n🃏 Fetching all cards...');
  
  let allCards = [];
  let page = 1;
  let totalPages = 1;
  const pageSize = 100; // Reduced from 250 to avoid timeouts
  
  while (page <= totalPages) {
    console.log(`📄 Fetching page ${page}/${totalPages}...`);
    
    const url = `${API_BASE_URL}/cards?page=${page}&pageSize=${pageSize}`;
    const data = await fetchWithRetry(url);
    
    allCards = allCards.concat(data.data || []);
    totalPages = Math.ceil(data.totalCount / pageSize);
    
    console.log(`   Added ${data.data?.length || 0} cards (Total: ${allCards.length}/${data.totalCount})`);
    
    page++;
    
    // Rate limiting delay (except for last page)
    if (page <= totalPages) {
      console.log(`   ⏳ Waiting ${DELAY_BETWEEN_REQUESTS/1000}s before next request...`);
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }
  
  console.log(`✅ Fetched all ${allCards.length} cards`);
  
  // Save all cards to one file
  const allCardsFile = path.join(DATA_DIR, 'cards-all.json');
  fs.writeFileSync(allCardsFile, JSON.stringify(allCards, null, 2));
  console.log(`💾 Saved all cards to ${allCardsFile}`);
  
  // Also save cards by set for easier querying
  console.log('\n📂 Organizing cards by set...');
  const cardsBySet = {};
  
  allCards.forEach(card => {
    const setId = card.set?.id || 'unknown';
    if (!cardsBySet[setId]) {
      cardsBySet[setId] = [];
    }
    cardsBySet[setId].push(card);
  });
  
  // Create sets directory
  const setsDir = path.join(DATA_DIR, 'sets');
  if (!fs.existsSync(setsDir)) {
    fs.mkdirSync(setsDir, { recursive: true });
  }
  
  // Save each set's cards
  Object.entries(cardsBySet).forEach(([setId, cards]) => {
    const setFile = path.join(setsDir, `${setId}.json`);
    fs.writeFileSync(setFile, JSON.stringify(cards, null, 2));
  });
  
  console.log(`💾 Saved ${Object.keys(cardsBySet).length} set files to ${setsDir}/`);
  
  return allCards;
}

/**
 * Fetch metadata (types, subtypes, supertypes, rarities)
 */
async function fetchMetadata() {
  console.log('\n📋 Fetching metadata...');
  
  const metadata = {};
  const endpoints = ['types', 'subtypes', 'supertypes', 'rarities'];
  
  for (const endpoint of endpoints) {
    console.log(`  Fetching ${endpoint}...`);
    const data = await fetchWithRetry(`${API_BASE_URL}/${endpoint}`);
    metadata[endpoint] = data.data || [];
    await sleep(1000); // Small delay between metadata requests
  }
  
  const metadataFile = path.join(DATA_DIR, 'metadata.json');
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
  console.log(`💾 Saved metadata to ${metadataFile}`);
  
  return metadata;
}

/**
 * Generate summary statistics
 */
function generateSummary(sets, cards, metadata) {
  const summary = {
    lastUpdated: new Date().toISOString(),
    totalSets: sets.length,
    totalCards: cards.length,
    metadata: {
      types: metadata.types?.length || 0,
      subtypes: metadata.subtypes?.length || 0,
      supertypes: metadata.supertypes?.length || 0,
      rarities: metadata.rarities?.length || 0,
    },
    cardsBySupertype: {},
    cardsByRarity: {},
  };
  
  // Calculate distributions
  cards.forEach(card => {
    const supertype = card.supertype || 'Unknown';
    const rarity = card.rarity || 'Unknown';
    
    summary.cardsBySupertype[supertype] = (summary.cardsBySupertype[supertype] || 0) + 1;
    summary.cardsByRarity[rarity] = (summary.cardsByRarity[rarity] || 0) + 1;
  });
  
  const summaryFile = path.join(DATA_DIR, 'summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  console.log(`\n📊 Summary saved to ${summaryFile}`);
  
  return summary;
}

/**
 * Main sync function
 */
async function main() {
  console.log('🚀 Starting Pokémon TCG data sync...\n');
  console.log(`📁 Data will be saved to: ${DATA_DIR}\n`);
  
  const startTime = Date.now();
  
  try {
    // Fetch all data
    const sets = await fetchAllSets();
    await sleep(2000);
    
    const cards = await fetchAllCards();
    await sleep(2000);
    
    const metadata = await fetchMetadata();
    
    // Generate summary
    const summary = generateSummary(sets, cards, metadata);
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    console.log('\n✨ Sync completed successfully!');
    console.log(`⏱️  Total time: ${duration} minutes`);
    console.log(`\n📊 Statistics:`);
    console.log(`   Sets: ${summary.totalSets}`);
    console.log(`   Cards: ${summary.totalCards}`);
    console.log(`   Types: ${summary.metadata.types}`);
    console.log(`   Rarities: ${summary.metadata.rarities}`);
    
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { fetchAllSets, fetchAllCards, fetchMetadata };


