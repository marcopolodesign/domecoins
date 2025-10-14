#!/usr/bin/env node

/**
 * Download specific Pokemon TCG sets
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const API_BASE_URL = 'https://api.pokemontcg.io/v2';
const DATA_DIR = path.join(__dirname, '..', 'data', 'pokemon-tcg');
const API_KEY = process.env.POKEMON_TCG_API_KEY || process.env.NEXT_PUBLIC_POKEMON_API_KEY;

// Sets to download (by name)
const SETS_TO_DOWNLOAD = [
  'Scarlet & Violet 151',
  'Crown Zenith',
  'Celebrations',
  'Destined Rivals'
];

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Make HTTPS request using Node's native https module (bypass fetch issues)
 */
function httpsRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Pokemon-TCG-Shop/1.0',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        } else if (res.statusCode === 429) {
          reject(new Error('RATE_LIMITED'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Find set ID by name
 */
async function findSetByName(setName) {
  console.log(`🔍 Searching for set: "${setName}"...`);
  
  try {
    const headers = {};
    if (API_KEY) {
      headers['X-Api-Key'] = API_KEY;
    }

    const data = await httpsRequest(`${API_BASE_URL}/sets`, headers);
    
    const sets = data.data || [];
    const found = sets.find(s => s.name.toLowerCase() === setName.toLowerCase());
    
    if (found) {
      console.log(`✅ Found: ${found.name} (${found.id}) - ${found.total} cards`);
      return found;
    } else {
      console.log(`❌ Set "${setName}" not found`);
      return null;
    }
  } catch (error) {
    console.error(`Error finding set: ${error.message}`);
    return null;
  }
}

/**
 * Download all cards for a specific set
 */
async function downloadSetCards(setInfo) {
  console.log(`\n📥 Downloading cards for: ${setInfo.name} (${setInfo.id})...`);
  
  try {
    const headers = {};
    if (API_KEY) {
      headers['X-Api-Key'] = API_KEY;
    }

    let allCards = [];
    let page = 1;
    let totalPages = 1;
    const pageSize = 250;
    
    while (page <= totalPages) {
      const url = `${API_BASE_URL}/cards?q=set.id:${setInfo.id}&page=${page}&pageSize=${pageSize}`;
      console.log(`   📄 Fetching page ${page}/${totalPages}...`);
      
      try {
        const data = await httpsRequest(url, headers);
        
        allCards = allCards.concat(data.data || []);
        totalPages = Math.ceil(data.totalCount / pageSize);
        
        console.log(`   ✓ Got ${data.data?.length || 0} cards (Total: ${allCards.length}/${data.totalCount})`);
        
        page++;
        
        // Rate limiting delay
        if (page <= totalPages) {
          await sleep(1000); // 1 second between requests
        }
      } catch (error) {
        if (error.message === 'RATE_LIMITED') {
          console.log(`   ⏸️  Rate limited. Waiting 60 seconds...`);
          await sleep(60000);
          continue; // Retry same page
        } else {
          throw error;
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
    console.error(`❌ Error downloading set cards: ${error.message}`);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Pokemon TCG set download...\n');
  console.log(`📁 Data directory: ${DATA_DIR}\n`);
  
  if (!API_KEY) {
    console.warn('⚠️  Warning: No API key found. Rate limits will be restrictive.');
    console.warn('   Set POKEMON_TCG_API_KEY or NEXT_PUBLIC_POKEMON_API_KEY\n');
  } else {
    console.log(`✓ Using API key: ${API_KEY.substring(0, 8)}...\n`);
  }
  
  const results = [];
  
  for (const setName of SETS_TO_DOWNLOAD) {
    try {
      const setInfo = await findSetByName(setName);
      
      if (setInfo) {
        await sleep(2000); // Delay before downloading cards
        const cards = await downloadSetCards(setInfo);
        
        results.push({
          name: setInfo.name,
          id: setInfo.id,
          cardsDownloaded: cards.length,
          success: true
        });
      } else {
        results.push({
          name: setName,
          success: false,
          error: 'Set not found'
        });
      }
      
      // Delay between sets
      await sleep(3000);
      
    } catch (error) {
      console.error(`\n❌ Failed to download ${setName}:`, error.message);
      results.push({
        name: setName,
        success: false,
        error: error.message
      });
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
      console.log(`❌ ${result.name}: ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCards = results.reduce((sum, r) => sum + (r.cardsDownloaded || 0), 0);
  
  console.log('\n' + '='.repeat(60));
  console.log(`✨ Downloaded ${successCount}/${SETS_TO_DOWNLOAD.length} sets`);
  console.log(`📦 Total cards: ${totalCards}`);
  console.log('='.repeat(60));
}

// Run
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { findSetByName, downloadSetCards };

