#!/bin/bash

###############################################################################
# Pokemon TCG Set Downloader
# 
# This script downloads specific sets from the Pokemon TCG API.
# 
# IMPORTANT: Run this script from a network where api.pokemontcg.io is reachable!
# Your current network appears to block this API.
#
# Options to try:
# 1. Use a different WiFi network
# 2. Use mobile hotspot from your phone
# 3. Use a VPN
# 4. Run from a different computer and transfer files
###############################################################################

# Configuration
API_KEY="${POKEMON_TCG_API_KEY:-445630f3-81ff-43ee-aa1f-9e8c56bdfd08}"
DATA_DIR="$(cd "$(dirname "$0")/../data/pokemon-tcg" && pwd)"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Pokemon TCG Set Downloader"
echo "================================"
echo ""
echo "📁 Data directory: $DATA_DIR"
echo "🔑 API Key: ${API_KEY:0:8}..."
echo ""

# Test connectivity first
echo "🔍 Testing API connectivity..."
if curl -m 5 -s "https://api.pokemontcg.io/v2/sets" -H "X-Api-Key: $API_KEY" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API is reachable!${NC}"
    echo ""
else
    echo -e "${RED}✗ Cannot reach Pokemon TCG API!${NC}"
    echo ""
    echo "Please try:"
    echo "  1. Connect to a different network"
    echo "  2. Use a VPN"
    echo "  3. Check your firewall settings"
    echo ""
    exit 1
fi

# Function to download a set
download_set() {
    local set_id="$1"
    local set_name="$2"
    local output_file="$DATA_DIR/${set_id}-full.json"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📥 Downloading: $set_name ($set_id)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Get set info first
    set_info=$(curl -s "https://api.pokemontcg.io/v2/sets/$set_id" -H "X-Api-Key: $API_KEY")
    total_cards=$(echo "$set_info" | jq -r '.data.total // 0')
    
    if [ "$total_cards" -eq 0 ]; then
        echo -e "${RED}✗ Set not found or error getting set info${NC}"
        return 1
    fi
    
    echo "📊 Total cards in set: $total_cards"
    
    # Download all cards (using pageSize=250, most sets fit in 1 page)
    echo "⬇️  Fetching cards..."
    
    response=$(curl -s "https://api.pokemontcg.io/v2/cards?q=set.id:$set_id&pageSize=250&page=1" \
        -H "X-Api-Key: $API_KEY" \
        -H "Accept: application/json")
    
    # Extract just the data array and save
    echo "$response" | jq '.data' > "$output_file"
    
    # Verify
    downloaded_count=$(jq 'length' "$output_file")
    file_size=$(ls -lh "$output_file" | awk '{print $5}')
    
    if [ "$downloaded_count" -gt 0 ]; then
        echo -e "${GREEN}✓ Downloaded $downloaded_count cards ($file_size)${NC}"
        echo "💾 Saved to: ${output_file##*/}"
        return 0
    else
        echo -e "${RED}✗ Download failed or no cards found${NC}"
        rm -f "$output_file"
        return 1
    fi
}

# Create data directory if needed
mkdir -p "$DATA_DIR"

# Download each set
declare -i success_count=0
declare -i total_count=0

# Array of sets to download
declare -a SETS=(
    "sv3pt5:Scarlet & Violet 151"
    "swsh12pt5:Crown Zenith"
    "cel25:Celebrations"
    "sv9pt5:Destined Rivals"
)

for set in "${SETS[@]}"; do
    IFS=':' read -r set_id set_name <<< "$set"
    ((total_count++))
    
    # Check if already exists
    if [ -f "$DATA_DIR/${set_id}-full.json" ]; then
        existing_count=$(jq 'length' "$DATA_DIR/${set_id}-full.json" 2>/dev/null || echo "0")
        if [ "$existing_count" -gt 0 ]; then
            echo -e "${YELLOW}⚠️  $set_name already downloaded ($existing_count cards)${NC}"
            ((success_count++))
            continue
        fi
    fi
    
    if download_set "$set_id" "$set_name"; then
        ((success_count++))
    fi
    
    # Rate limiting delay
    if [ $total_count -lt ${#SETS[@]} ]; then
        echo "⏳ Waiting 3 seconds..."
        sleep 3
        echo ""
    fi
done

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Successfully downloaded: $success_count/${#SETS[@]} sets"
echo ""
echo "Files in $DATA_DIR:"
ls -lh "$DATA_DIR"/*-full.json 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
echo ""

if [ $success_count -eq ${#SETS[@]} ]; then
    echo -e "${GREEN}✨ All sets downloaded successfully!${NC}"
    echo ""
    echo "💡 Next steps:"
    echo "  1. Restart your Next.js server"
    echo "  2. The search API will automatically use the new data"
else
    echo -e "${YELLOW}⚠️  Some sets failed to download${NC}"
    echo "  Check your network connection and try again"
fi

echo ""

