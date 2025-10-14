#!/usr/bin/env bash

###############################################################################
# Download Pokemon TCG Data from GitHub
# 
# Uses the official pokemon-tcg-data repository
# https://github.com/PokemonTCG/pokemon-tcg-data
# 
# NO API KEYS NEEDED - NO RATE LIMITS - NO CLOUDFLARE BLOCKING!
###############################################################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

GITHUB_RAW="https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/en"
DATA_DIR="$(cd "$(dirname "$0")/../data/pokemon-tcg" && pwd)"

echo "🎴 Pokemon TCG GitHub Data Downloader"
echo "======================================"
echo ""
echo "📁 Data directory: $DATA_DIR"
echo "🌐 Source: github.com/PokemonTCG/pokemon-tcg-data"
echo ""

# Create directory
mkdir -p "$DATA_DIR"

# Sets to download (compatible with older bash)
download_set() {
    local set_id=$1
    local set_name=$2
    local output_file="$DATA_DIR/${set_id}-full.json"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📥 Downloading: $set_name ($set_id)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Download from GitHub
    local url="$GITHUB_RAW/$set_id.json"
    
    echo "🔗 URL: $url"
    
    if curl -f -s "$url" -o "$output_file"; then
        local count=$(jq 'length' "$output_file" 2>/dev/null || echo "0")
        local size=$(ls -lh "$output_file" | awk '{print $5}')
        
        if [ "$count" -gt 0 ]; then
            echo -e "${GREEN}✓ Downloaded $count cards ($size)${NC}"
        else
            echo -e "${YELLOW}⚠️  File downloaded but appears empty${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Failed - file might not exist on GitHub${NC}"
        echo "   Trying alternative path..."
        
        # Some sets might be in different paths
        rm -f "$output_file"
    fi
    
    echo ""
}

# Download each set
download_set "sv3pt5" "Scarlet & Violet 151"
download_set "swsh12pt5" "Crown Zenith"
download_set "cel25" "Celebrations"
download_set "sv9pt5" "Destined Rivals"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ls -lh "$DATA_DIR"/*-full.json 2>/dev/null | while read line; do
    file=$(echo "$line" | awk '{print $9}')
    size=$(echo "$line" | awk '{print $5}')
    name=$(basename "$file")
    count=$(jq 'length' "$file" 2>/dev/null || echo "?")
    echo "  $name: $count cards ($size)"
done

echo ""
echo "✨ Done! Data downloaded from GitHub (no API needed!)"
echo "🔄 Restart your Next.js server to use the new data"

