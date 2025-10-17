#!/usr/bin/env node
/**
 * Test script to debug TCGPlayer page scraping
 * Usage: node scripts/test-tcgplayer-scraping.js [productId]
 */

const axios = require('axios');

async function testProductScraping(productId) {
  try {
    console.log(`\n🔍 Fetching product page for ID: ${productId}`);
    console.log(`URL: https://www.tcgplayer.com/product/${productId}\n`);
    
    const response = await axios.get(`https://www.tcgplayer.com/product/${productId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });
    
    const html = response.data;
    console.log(`✅ Successfully fetched HTML (${html.length} bytes)\n`);
    
    // Extract __NEXT_DATA__
    const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    
    if (!scriptMatch || !scriptMatch[1]) {
      console.error('❌ Could not find __NEXT_DATA__ script');
      
      // Try to find any script tags
      const allScripts = html.match(/<script[^>]*>/g);
      console.log(`\nFound ${allScripts ? allScripts.length : 0} script tags`);
      if (allScripts) {
        console.log('Script tags:', allScripts.slice(0, 5).join('\n'));
      }
      return;
    }
    
    console.log('✅ Found __NEXT_DATA__ script\n');
    
    const nextData = JSON.parse(scriptMatch[1]);
    
    // Log the structure
    console.log('📦 Next.js Data Structure:');
    console.log('Keys:', Object.keys(nextData));
    
    if (nextData.props) {
      console.log('\nprops keys:', Object.keys(nextData.props));
      
      if (nextData.props.pageProps) {
        console.log('pageProps keys:', Object.keys(nextData.props.pageProps));
        
        // Try to find product data in different locations
        const pageProps = nextData.props.pageProps;
        
        if (pageProps.initialReduxState) {
          console.log('\ninitialReduxState keys:', Object.keys(pageProps.initialReduxState));
          
          if (pageProps.initialReduxState.productGroup) {
            console.log('productGroup keys:', Object.keys(pageProps.initialReduxState.productGroup));
            
            if (pageProps.initialReduxState.productGroup.group) {
              const group = pageProps.initialReduxState.productGroup.group;
              console.log('\n🎯 FOUND PRODUCT GROUP!');
              console.log('Product Name:', group.name || group.productName);
              console.log('Set Name:', group.setName || group.expansionName);
              
              // Check for variants/skus
              if (group.skus) {
                console.log(`\n✅ Found ${group.skus.length} SKUs (variants)`);
                console.log('\nFirst SKU structure:', JSON.stringify(group.skus[0], null, 2));
              } else if (group.variants) {
                console.log(`\n✅ Found ${group.variants.length} variants`);
                console.log('\nFirst variant structure:', JSON.stringify(group.variants[0], null, 2));
              } else {
                console.log('\n⚠️  No skus or variants found');
                console.log('Available keys in group:', Object.keys(group));
              }
            }
          }
        }
        
        // Also check direct product property
        if (pageProps.product) {
          console.log('\n📦 Direct product property found!');
          console.log('Product keys:', Object.keys(pageProps.product));
        }
        
        if (pageProps.productGroup) {
          console.log('\n📦 Direct productGroup property found!');
          console.log('ProductGroup keys:', Object.keys(pageProps.productGroup));
        }
      }
    }
    
    // Save full JSON to file for inspection
    const fs = require('fs');
    const outputFile = `/tmp/tcgplayer-${productId}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(nextData, null, 2));
    console.log(`\n💾 Full JSON saved to: ${outputFile}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

// Get product ID from command line or use default
const productId = process.argv[2] || '575819';
testProductScraping(productId);

