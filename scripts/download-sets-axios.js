#!/usr/bin/env node

/**
 * Download specific Pokemon TCG sets using axios
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const API_BASE_URL = 'https://api.pokemontcg.io/v2';
const DATA_DIR = path.join(__dirname, '..', 'data', 'pokemon-tcg');
const API_KEY = process.env.POKEMON_TCG_API_KEY || process.env.NEXT_PUBLIC_POKEMON_API_KEY;

// Sets to download - using set IDs directly since we know them
const SETS_TO_DOWNLOAD = [
  { name: 'Scarlet & Violet 151', id: 'sv3pt5' },
  { name: 'Crown Zenith', id: 'swsh12pt5' },
  { name: 'Celebrations', id: 'cel25' },
  { name: 'Destined Rivals', id: 'sv9pt5' }
];

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Configure axios with longer timeout and retries
const axiosInstance = axios.create({
  timeout: 30000, // 30 second timeout
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Pokemon-TCG-Shop/1.0'
  }
});

if (API_KEY) {
  axiosInstance.defaults.headers['X-Api-Key'] = API_KEY;
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Download all cards for a specific set
 */
async function downloadSetCards(setInfo, retries = 3) {
  console.log(`\n📥 Downloading cards for: ${setInfo.name} (${setInfo.id})...`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      let allCards = [];
      let page = 1;
      let totalPages = 1;
      const pageSize = 250;
      
      while (page <= totalPages) {
        const url = `${API_BASE_URL}/cards?q=set.id:${setInfo.id}&page=${page}&pageSize=${pageSize}`;
        console.log(`   📄 Fetching page ${page}/${totalPages} (attempt ${attempt}/${retries})...`);
        
        try {
          const response = await axiosInstance.get(url);
          const data = response.data;
          
          allCards = allCards.concat(data.data || []);
          totalPages = Math.ceil(data.totalCount / pageSize);
          
          console.log(`   ✓ Got ${data.data?.length || 0} cards (Total: ${allCards.length}/${data.totalCount})`);
          
          page++;
          
          // Rate limiting delay
          if (page <= totalPages) {
            await sleep(2000); // 2 seconds between requests
          }
        } catch (pageError) {
          if (pageError.response?.status === 429) {
            console.log(`   ⏸️  Rate limited. Waiting 60 seconds...`);
            await sleep(60000);
            continue; // Retry same page
          } else {
            throw pageError;
          }
        }
      }
      
      // Save to file
      const filename = `${setInfo.id}-full.json`;
      const filepath = path.join(DATA_DIR, filename);
      fs.writeFileSync(filepath, JSON.stringify(allCards, null, 2));
      
      console.log(`✅ Saved ${allCards.length} cards to ${filename}`);
      
      return allCards;
      
    } catch (error) {
      console.error(`   ❌ Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < retries) {
        const waitTime = attempt * 5000; // Incremental backoff
        console.log(`   ⏳ Waiting ${waitTime/1000}s before retry...`);
        await sleep(waitTime);
      } else {
        throw error;
      }
    }
  }
}

/**
 * Verify set exists by fetching set info
 */
async function verifySet(setId) {
  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/sets/${setId}`);
    return response.data.data;
  } catch (error) {
    console.error(`   Cannot verify set ${setId}: ${error.message}`);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Pokemon TCG set download (using axios)...\n');
  console.log(`📁 Data directory: ${DATA_DIR}\n`);
  
  if (!API_KEY) {
    console.warn('⚠️  Warning: No API key found. Trying without API key...');
    console.warn('   Downloads may fail due to rate limits.\n');
  } else {
    console.log(`✓ Using API key: ${API_KEY.substring(0, 8)}...\n`);
  }
  
  const results = [];
  
  for (const setInfo of SETS_TO_DOWNLOAD) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Processing: ${setInfo.name} (${setInfo.id})`);
      console.log('='.repeat(60));
      
      // Verify set exists first
      console.log('🔍 Verifying set...');
      const verifiedSet = await verifySet(setInfo.id);
      
      if (!verifiedSet) {
        results.push({
          name: setInfo.name,
          id: setInfo.id,
          success: false,
          error: 'Set not found or unreachable'
        });
        continue;
      }
      
      console.log(`✅ Verified: ${verifiedSet.name} - ${verifiedSet.total} cards total`);
      
      await sleep(2000); // Delay before downloading cards
      const cards = await downloadSetCards({ ...setInfo, total: verifiedSet.total });
      
      results.push({
        name: setInfo.name,
        id: setInfo.id,
        cardsDownloaded: cards.length,
        success: true
      });
      
      // Delay between sets
      await sleep(5000);
      
    } catch (error) {
      console.error(`\n❌ Failed to download ${setInfo.name}:`, error.message);
      results.push({
        name: setInfo.name,
        id: setInfo.id,
        success: false,
        error: error.message
      });
      
      // Continue with next set
      await sleep(3000);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Download Summary:');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.name} (${result.id}): ${result.cardsDownloaded} cards`);
    } else {
      console.log(`❌ ${result.name} (${result.id}): ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCards = results.reduce((sum, r) => sum + (r.cardsDownloaded || 0), 0);
  
  console.log('\n' + '='.repeat(60));
  console.log(`✨ Downloaded ${successCount}/${SETS_TO_DOWNLOAD.length} sets`);
  console.log(`📦 Total cards: ${totalCards}`);
  console.log('='.repeat(60));
  
  if (successCount > 0) {
    console.log('\n💡 Tip: Restart your Next.js server to use the new data!');
  }
}

// Run
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { downloadSetCards };

