# 🔗 Direct Download Links for Remaining Sets

Since Crown Zenith and Destined Rivals are timing out due to Cloudflare blocking, here are alternative methods to get them:

## ✅ Status:
- ✅ **Scarlet & Violet 151** - DONE (207 cards, 579KB)
- ✅ **Celebrations** - DONE (25 cards, 68.7KB) 
- ❌ **Crown Zenith** - TIMING OUT
- ❌ **Destined Rivals** - TIMING OUT

---

## Method 1: Try Individual Downloads (Retry with Delays)

The tool now has "Test Download" buttons. Try these steps:

1. Wait 2-3 minutes (let rate limits reset)
2. Open: `http://localhost:3002/download-sets.html`
3. Click **"Test Download"** on Crown Zenith
4. Wait 3 minutes
5. Click **"Test Download"** on Destined Rivals

Sometimes waiting between attempts helps bypass Cloudflare's protection.

---

## Method 2: Direct Browser Access (Copy-Paste Method)

### Crown Zenith (swsh12pt5):

1. **Open this URL in your browser**:
   ```
   https://api.pokemontcg.io/v2/cards?q=set.id:swsh12pt5&pageSize=250&page=1
   ```

2. **If it loads** (you'll see JSON), do this:
   - Press `Cmd+A` (select all)
   - Press `Cmd+C` (copy)
   - Open TextEdit or VS Code
   - Paste the content
   - Look for the `"data"` array (it starts with `"data": [`)
   - Copy ONLY the array contents (from `[` to `]` after "data":)
   - Save as: `swsh12pt5-full.json` in `data/pokemon-tcg/`

3. **If it times out**, try:
   - Refresh a few times
   - Try in incognito/private mode
   - Try a different browser (Chrome, Safari, Firefox)
   - Wait 5 minutes and try again

### Destined Rivals (sv9pt5):

1. **Open this URL**:
   ```
   https://api.pokemontcg.io/v2/cards?q=set.id:sv9pt5&pageSize=250&page=1
   ```

2. Same process as above

---

## Method 3: Use cURL with Multiple Retries

Since the API works intermittently, try this script that retries multiple times:

```bash
cd /Users/mataldao/Local/pokemon-tcg-shop

# Create retry script
cat > scripts/retry-download.sh << 'EOF'
#!/bin/bash

API_KEY="445630f3-81ff-43ee-aa1f-9e8c56bdfd08"
DATA_DIR="data/pokemon-tcg"

download_with_retry() {
    local set_id=$1
    local set_name=$2
    local max_attempts=5
    local attempt=1
    
    echo "Downloading $set_name ($set_id)..."
    
    while [ $attempt -le $max_attempts ]; do
        echo "  Attempt $attempt/$max_attempts..."
        
        if curl -m 45 -s \
            "https://api.pokemontcg.io/v2/cards?q=set.id:$set_id&pageSize=250&page=1" \
            -H "X-Api-Key: $API_KEY" \
            -H "Accept: application/json" \
            | jq '.data' > "$DATA_DIR/$set_id-full.json" 2>/dev/null; then
            
            # Check if file has content
            count=$(jq 'length' "$DATA_DIR/$set_id-full.json" 2>/dev/null || echo "0")
            if [ "$count" -gt 0 ]; then
                echo "  ✓ Success! Downloaded $count cards"
                return 0
            fi
        fi
        
        echo "  ✗ Failed, waiting 30 seconds..."
        sleep 30
        ((attempt++))
    done
    
    echo "  ✗ All attempts failed for $set_name"
    return 1
}

# Try Crown Zenith
download_with_retry "swsh12pt5" "Crown Zenith"
sleep 60

# Try Destined Rivals  
download_with_retry "sv9pt5" "Destined Rivals"

echo ""
echo "Done! Check data/pokemon-tcg/ for downloaded files"
EOF

chmod +x scripts/retry-download.sh
./scripts/retry-download.sh
```

This will make 5 attempts for each set with 30-second delays between attempts.

---

## Method 4: Alternative Data Sources

If the official API keeps timing out, these sets are also available from:

### GitHub/Community Sources:
Some people host Pokemon TCG data on GitHub. Search for:
- `pokemon tcg crown zenith json site:github.com`
- `pokemon tcg data swsh12pt5 site:github.com`

### TCGPlayer Direct:
The cards are available with prices on TCGPlayer, though you'd need to scrape them.

---

## Method 5: Network Change

The most reliable solution:

1. **Connect to different WiFi** (coffee shop, friend's house, etc.)
2. Run the download tool again
3. OR use your phone's hotspot:
   - Enable hotspot on your phone
   - Connect your Mac to it
   - Try the browser tool again

The blocking seems to be IP-based, so changing networks often works immediately.

---

## Method 6: VPN

1. Install a VPN (Cloudflare WARP is free: https://1.1.1.1/)
2. Connect to VPN
3. Try browser tool again
4. Disconnect VPN after downloading

---

## Expected File Sizes (to verify real data):

When you get the real files, they should be approximately:

- **Crown Zenith** (`swsh12pt5-full.json`): ~250-350KB (160 cards)
- **Destined Rivals** (`sv9pt5-full.json`): ~150-200KB (94 cards)

Current mock versions are 19KB and 143KB respectively, so you'll see a big difference.

---

## Quick Verification:

After getting any new files, verify they're real:

```bash
# Check Crown Zenith
jq '.[0] | {id, name, set: .set.name}' data/pokemon-tcg/swsh12pt5-full.json

# Should show something like:
# {
#   "id": "swsh12pt5-1",
#   "name": "Hoppip",
#   "set": "Crown Zenith"
# }

# Check Destined Rivals
jq '.[0] | {id, name, set: .set.name}' data/pokemon-tcg/sv9pt5-full.json
```

---

## Need Help?

If you're stuck, let me know:
1. Which method you tried
2. What error you got
3. We can try another approach!

