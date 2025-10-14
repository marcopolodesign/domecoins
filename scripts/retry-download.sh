#!/bin/bash

###############################################################################
# Retry Download Script for Pokemon TCG Sets
# 
# This script makes multiple attempts to download sets that are timing out
# Uses exponential backoff and multiple retry attempts
###############################################################################

API_KEY="445630f3-81ff-43ee-aa1f-9e8c56bdfd08"
DATA_DIR="$(cd "$(dirname "$0")/../data/pokemon-tcg" && pwd)"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔄 Pokemon TCG Retry Downloader"
echo "================================"
echo ""
echo "📁 Data directory: $DATA_DIR"
echo "🔑 API Key: ${API_KEY:0:8}..."
echo ""

download_with_retry() {
    local set_id=$1
    local set_name=$2
    local max_attempts=6
    local attempt=1
    local output_file="$DATA_DIR/$set_id-full.json"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📥 Downloading: $set_name ($set_id)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    while [ $attempt -le $max_attempts ]; do
        local wait_time=$((attempt * 10))
        
        echo -e "${YELLOW}🔄 Attempt $attempt/$max_attempts...${NC}"
        
        # Make the request with timeout
        if timeout 60 curl -s \
            "https://api.pokemontcg.io/v2/cards?q=set.id:$set_id&pageSize=250&page=1" \
            -H "X-Api-Key: $API_KEY" \
            -H "Accept: application/json" \
            -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
            -o "/tmp/${set_id}-response.json" 2>/dev/null; then
            
            # Extract just the data array
            if jq '.data' "/tmp/${set_id}-response.json" > "$output_file" 2>/dev/null; then
                # Check if file has content
                local count=$(jq 'length' "$output_file" 2>/dev/null || echo "0")
                local size=$(ls -lh "$output_file" 2>/dev/null | awk '{print $5}')
                
                if [ "$count" -gt 0 ]; then
                    echo -e "${GREEN}✓ Success! Downloaded $count cards ($size)${NC}"
                    rm -f "/tmp/${set_id}-response.json"
                    return 0
                else
                    echo -e "${RED}✗ Response contained no cards${NC}"
                fi
            else
                echo -e "${RED}✗ Failed to parse JSON response${NC}"
            fi
        else
            echo -e "${RED}✗ Request failed or timed out${NC}"
        fi
        
        # Clean up temp file
        rm -f "/tmp/${set_id}-response.json"
        
        if [ $attempt -lt $max_attempts ]; then
            echo -e "${YELLOW}⏳ Waiting ${wait_time} seconds before retry...${NC}"
            sleep $wait_time
        fi
        
        ((attempt++))
    done
    
    echo -e "${RED}✗ All $max_attempts attempts failed for $set_name${NC}"
    return 1
}

# Download Crown Zenith
if [ -f "$DATA_DIR/swsh12pt5-full.json" ]; then
    existing_count=$(jq 'length' "$DATA_DIR/swsh12pt5-full.json" 2>/dev/null || echo "0")
    if [ "$existing_count" -gt 50 ]; then
        echo -e "${GREEN}✓ Crown Zenith already exists with $existing_count cards${NC}"
    else
        echo "Crown Zenith exists but seems incomplete ($existing_count cards), re-downloading..."
        download_with_retry "swsh12pt5" "Crown Zenith"
    fi
else
    download_with_retry "swsh12pt5" "Crown Zenith"
fi

echo ""
echo "⏳ Waiting 60 seconds before next set..."
sleep 60
echo ""

# Download Destined Rivals
if [ -f "$DATA_DIR/sv9pt5-full.json" ]; then
    existing_count=$(jq 'length' "$DATA_DIR/sv9pt5-full.json" 2>/dev/null || echo "0")
    if [ "$existing_count" -gt 50 ]; then
        echo -e "${GREEN}✓ Destined Rivals already exists with $existing_count cards${NC}"
    else
        echo "Destined Rivals exists but seems incomplete ($existing_count cards), re-downloading..."
        download_with_retry "sv9pt5" "Destined Rivals"
    fi
else
    download_with_retry "sv9pt5" "Destined Rivals"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Final Status"
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
echo "Done! If you got the files, restart your Next.js server."

