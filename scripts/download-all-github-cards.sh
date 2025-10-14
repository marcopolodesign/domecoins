#!/usr/bin/env bash

###############################################################################
# Download ALL Pokemon TCG Card Data from GitHub
# 
# Downloads every available set from the official pokemon-tcg-data repository
# https://github.com/PokemonTCG/pokemon-tcg-data
###############################################################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

GITHUB_RAW="https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/en"
DATA_DIR="$(cd "$(dirname "$0")/../data/pokemon-tcg" && pwd)"

echo "🎴 Pokemon TCG Complete Data Downloader"
echo "========================================="
echo ""
echo "📁 Data directory: $DATA_DIR"
echo "🌐 Source: github.com/PokemonTCG/pokemon-tcg-data"
echo ""

mkdir -p "$DATA_DIR"

# Get list of all available sets from the GitHub API
echo -e "${BLUE}📡 Fetching list of available sets from GitHub...${NC}"

# Using GitHub API to list all JSON files in the cards/en directory
sets_list=$(curl -s "https://api.github.com/repos/PokemonTCG/pokemon-tcg-data/contents/cards/en" | \
  jq -r '.[] | select(.name | endswith(".json")) | .name' | \
  sed 's/\.json$//')

if [ -z "$sets_list" ]; then
  echo -e "${YELLOW}⚠️  Could not fetch sets list from GitHub API${NC}"
  echo "   Falling back to known sets..."
  
  # Fallback to known popular sets
  sets_list="base1 base2 base3 base4 base5 gym1 gym2 neo1 neo2 neo3 neo4 ecard1 ecard2 ecard3 ex1 ex2 ex3 ex4 ex5 ex6 ex7 ex8 ex9 ex10 ex11 ex12 ex13 ex14 ex15 ex16 dp1 dp2 dp3 dp4 dp5 dp6 dp7 pl1 pl2 pl3 pl4 hgss1 hgss2 hgss3 hgss4 col1 bw1 bw2 bw3 bw4 bw5 bw6 bw7 bw8 bw9 bw10 bw11 xy1 xy2 xy3 xy4 xy5 xy6 xy7 xy8 xy9 xy10 xy11 xy12 sm1 sm2 sm3 sm4 sm5 sm6 sm7 sm8 sm9 sm10 sm11 sm12 sm115 sm12 swsh1 swsh2 swsh3 swsh4 swsh5 swsh6 swsh7 swsh8 swsh9 swsh10 swsh11 swsh12 swsh12pt5 cel25 sv1 sv2 sv3 sv3pt5 sv4 sv5 sv6 sv7 sv8"
fi

total_sets=$(echo "$sets_list" | wc -l | tr -d ' ')
echo -e "${GREEN}✓ Found $total_sets sets to download${NC}"
echo ""

downloaded=0
failed=0
skipped=0

for set_id in $sets_list; do
  output_file="$DATA_DIR/${set_id}-full.json"
  
  # Skip if already exists and has content
  if [ -f "$output_file" ]; then
    count=$(jq 'length' "$output_file" 2>/dev/null || echo "0")
    if [ "$count" -gt 0 ]; then
      echo -e "${YELLOW}⏭  Skipping $set_id (already exists with $count cards)${NC}"
      ((skipped++))
      continue
    fi
  fi
  
  echo "📥 Downloading: $set_id"
  
  url="$GITHUB_RAW/$set_id.json"
  
  if curl -f -s "$url" -o "$output_file" 2>/dev/null; then
    count=$(jq 'length' "$output_file" 2>/dev/null || echo "0")
    size=$(ls -lh "$output_file" | awk '{print $5}')
    
    if [ "$count" -gt 0 ]; then
      echo -e "${GREEN}   ✓ $count cards ($size)${NC}"
      ((downloaded++))
    else
      echo -e "${YELLOW}   ⚠ Empty file${NC}"
      rm -f "$output_file"
      ((failed++))
    fi
  else
    echo -e "${YELLOW}   ✗ Not found${NC}"
    rm -f "$output_file" 2>/dev/null
    ((failed++))
  fi
  
  # Small delay to be nice to GitHub
  sleep 0.5
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Download Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✓ Downloaded: $downloaded sets${NC}"
echo -e "${YELLOW}⏭ Skipped: $skipped sets${NC}"
echo -e "✗ Failed: $failed sets"
echo ""

# Count total cards
total_cards=0
for file in "$DATA_DIR"/*-full.json; do
  if [ -f "$file" ]; then
    count=$(jq 'length' "$file" 2>/dev/null || echo "0")
    total_cards=$((total_cards + count))
  fi
done

echo "📦 Total cards in database: $total_cards"
echo ""
echo "✨ Done! Restart your Next.js server to use the new data"

