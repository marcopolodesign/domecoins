#!/bin/bash

###############################################################################
# Move Downloaded Pokemon TCG Set Files
# 
# This script moves the downloaded JSON files from your Downloads folder
# to the data/pokemon-tcg directory
###############################################################################

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DATA_DIR="$(cd "$(dirname "$0")/../data/pokemon-tcg" && pwd)"
DOWNLOADS_DIR="$HOME/Downloads"

echo "🎴 Pokemon TCG Set File Mover"
echo "============================="
echo ""
echo "📁 Looking in: $DOWNLOADS_DIR"
echo "📁 Moving to: $DATA_DIR"
echo ""

# Files to look for
FILES=(
    "sv3pt5-full.json"
    "cel25-full.json"
    "sv9pt5-full.json"
    "swsh12pt5-full.json"
)

moved_count=0
already_exist=0
not_found=0

for file in "${FILES[@]}"; do
    source_path="$DOWNLOADS_DIR/$file"
    dest_path="$DATA_DIR/$file"
    
    if [ -f "$source_path" ]; then
        # Check if destination already exists
        if [ -f "$dest_path" ]; then
            # Compare file sizes
            source_size=$(stat -f%z "$source_path")
            dest_size=$(stat -f%z "$dest_path")
            
            if [ "$source_size" -gt "$dest_size" ]; then
                echo -e "${YELLOW}⚠️  $file exists but new file is larger - replacing...${NC}"
                mv "$source_path" "$dest_path"
                ((moved_count++))
            else
                echo -e "${YELLOW}ℹ️  $file already exists (keeping existing)${NC}"
                rm "$source_path"  # Remove the download
                ((already_exist++))
            fi
        else
            echo -e "${GREEN}✓ Moving $file${NC}"
            mv "$source_path" "$dest_path"
            ((moved_count++))
        fi
    else
        echo -e "${RED}✗ $file not found in Downloads${NC}"
        ((not_found++))
    fi
done

echo ""
echo "============================="
echo "📊 Summary:"
echo "  Moved: $moved_count"
echo "  Already exist: $already_exist"
echo "  Not found: $not_found"
echo ""

if [ $moved_count -gt 0 ]; then
    echo -e "${GREEN}✨ Files moved successfully!${NC}"
    echo ""
    echo "📋 Current files in data directory:"
    ls -lh "$DATA_DIR"/*-full.json 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
    echo ""
    echo "🔄 Next step: Restart your Next.js server"
    echo "   Press Ctrl+C in your server terminal, then run: npm run dev"
else
    echo -e "${YELLOW}⚠️  No files were moved.${NC}"
    echo ""
    if [ $not_found -gt 0 ]; then
        echo "💡 Make sure you've downloaded the files using the browser tool:"
        echo "   http://localhost:3002/download-sets.html"
    fi
fi

echo ""

